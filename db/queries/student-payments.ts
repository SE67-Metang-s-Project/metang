import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";
import { withSlipFlag } from "./loan-requests";

/** What the student gets back about their own submission. No storage path, no reviewer identity. */
const studentPaymentSelect = {
  id: true,
  loanId: true,
  installmentId: true,
  amount: true,
  status: true,
  paidAt: true,
  confirmedAt: true,
  reviewNote: true,
  createdAt: true,
  // Stripped by withSlipFlag; the student reads their own slip via GET /api/payments/{id}/slip.
  slipPath: true,
} satisfies Prisma.PaymentSelect;

/**
 * The one loan this student can be repaying. `one_open_loan_per_student` allows a single
 * non-terminal loan, and `disbursed` is non-terminal, so there is never more than one - which is
 * why the submission endpoint takes no loan id and resolves it here instead of making the client
 * fetch it first.
 *
 * Read outside the transaction only so the slip path can be built before upload; the write itself
 * re-checks ownership and status.
 */
export async function findRepayableLoanId(studentId: string) {
  const loan = await prisma.loanRequest.findFirst({
    where: { studentId, status: "disbursed" },
    select: { id: true },
  });
  return loan?.id ?? null;
}

export type StudentPaymentErrorCode =
  | "LOAN_NOT_FOUND"
  | "LOAN_NOT_DISBURSED"
  | "REVIEW_IN_PROGRESS"
  | "NOTHING_OUTSTANDING";

export class StudentPaymentError extends Error {
  constructor(readonly code: StudentPaymentErrorCode) {
    super(code);
  }
}

/**
 * Records a student's repayment slip for review. slipPath must already point at an uploaded object
 * (see the route) - the student's evidence is stored before the row exists, mirroring disbursement.
 *
 * Serializable so the one-open-review guard below cannot be raced: two submissions landing together
 * would otherwise both see no pending row, and an admin confirming both would credit the fund twice
 * for a single transfer.
 */
export async function createStudentPayment({
  loanId,
  studentId,
  amount,
  slipPath,
  paidAt,
}: {
  loanId: string;
  studentId: string;
  amount: number;
  slipPath: string;
  paidAt: Date | null;
}) {
  return prisma.$transaction(
    async (tx) => {
      const loan = await tx.loanRequest.findFirst({
        where: { id: loanId, studentId },
        select: { id: true, status: true },
      });
      if (!loan) throw new StudentPaymentError("LOAN_NOT_FOUND");
      if (loan.status !== "disbursed") throw new StudentPaymentError("LOAN_NOT_DISBURSED");

      const alreadyUnderReview = await tx.payment.findFirst({
        where: { loanId, status: "pending_review" },
        select: { id: true },
      });
      if (alreadyUnderReview) throw new StudentPaymentError("REVIEW_IN_PROGRESS");

      // Recorded for the reviewer's context only. The money itself is allocated oldest-first at
      // confirmation time (see allocatePayment), which need not be this installment.
      const nextDue = await tx.installment.findFirst({
        where: { loanId, settledAt: null },
        orderBy: { seq: "asc" },
        select: { id: true },
      });
      if (!nextDue) throw new StudentPaymentError("NOTHING_OUTSTANDING");

      const payment = await tx.payment.create({
        data: {
          loanId,
          installmentId: nextDue.id,
          amount,
          slipPath,
          paidAt: paidAt ?? new Date(),
          status: "pending_review",
        },
        select: studentPaymentSelect,
      });

      await tx.auditLog.create({
        data: {
          actorId: studentId,
          action: "payment.submitted",
          entityType: "payment",
          entityId: payment.id,
          after: serializeJson(withSlipFlag(payment)),
        },
      });

      return withSlipFlag(payment);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
  );
}
