import { Prisma } from "@/lib/generated/prisma/client";
import { allocatePayment } from "@/lib/loan-validation";
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
export async function findRepayableLoanId(studentCode: string) {
  const loan = await prisma.loanRequest.findFirst({
    where: { studentCode, status: "disbursed" },
    select: { id: true },
  });
  return loan?.id ?? null;
}

export type StudentPaymentErrorCode =
  | "LOAN_NOT_FOUND"
  | "LOAN_NOT_DISBURSED"
  | "TRANSFER_NOT_CONFIRMED"
  | "REVIEW_IN_PROGRESS"
  | "NOTHING_OUTSTANDING"
  | "AMOUNT_EXCEEDS_REMAINING";

export class StudentPaymentError extends Error {
  constructor(
    readonly code: StudentPaymentErrorCode,
    readonly remaining?: number,
  ) {
    super(code);
  }
}

/**
 * Runs createStudentPayment's refusals once before the slip is uploaded, so a submission that is
 * bound to be refused stores nothing - there is no storage delete to clean up after it. Advisory
 * only: it reads outside any transaction, and createStudentPayment re-checks every rule inside its
 * Serializable transaction, which stays the authority when two requests race.
 */
export async function assertStudentPaymentAllowed({
  loanId,
  studentCode,
  amount,
}: {
  loanId: string;
  studentCode: string;
  amount: number;
}) {
  const loan = await prisma.loanRequest.findFirst({
    where: { id: loanId, studentCode },
    select: {
      status: true,
      transferConfirmedAt: true,
      payments: { where: { status: "pending_review" }, select: { id: true }, take: 1 },
      installments: {
        where: { settledAt: null },
        orderBy: { seq: "asc" },
        select: { id: true, seq: true, amountDue: true, amountPaid: true },
      },
    },
  });
  // Same rules, codes and order as createStudentPayment below.
  if (!loan) throw new StudentPaymentError("LOAN_NOT_FOUND");
  if (loan.status !== "disbursed") throw new StudentPaymentError("LOAN_NOT_DISBURSED");
  if (!loan.transferConfirmedAt) throw new StudentPaymentError("TRANSFER_NOT_CONFIRMED");
  if (loan.payments.length > 0) throw new StudentPaymentError("REVIEW_IN_PROGRESS");
  if (loan.installments.length === 0) throw new StudentPaymentError("NOTHING_OUTSTANDING");
  const { surplus } = allocatePayment(loan.installments, amount);
  if (surplus > 0) throw new StudentPaymentError("AMOUNT_EXCEEDS_REMAINING", amount - surplus);
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
  studentCode,
  amount,
  slipPath,
  paidAt,
}: {
  loanId: string;
  studentCode: string;
  amount: number;
  slipPath: string;
  paidAt: Date | null;
}) {
  return prisma.$transaction(
    async (tx) => {
      const loan = await tx.loanRequest.findFirst({
        where: { id: loanId, studentCode },
        select: { id: true, status: true, transferConfirmedAt: true },
      });
      if (!loan) throw new StudentPaymentError("LOAN_NOT_FOUND");
      if (loan.status !== "disbursed") throw new StudentPaymentError("LOAN_NOT_DISBURSED");
      // The student must first confirm they received the money (confirm-transfer).
      if (!loan.transferConfirmedAt) throw new StudentPaymentError("TRANSFER_NOT_CONFIRMED");

      const alreadyUnderReview = await tx.payment.findFirst({
        where: { loanId, status: "pending_review" },
        select: { id: true },
      });
      if (alreadyUnderReview) throw new StudentPaymentError("REVIEW_IN_PROGRESS");

      // Recorded for the reviewer's context only. The money itself is allocated oldest-first at
      // confirmation time (see allocatePayment), which need not be this installment.
      const unsettled = await tx.installment.findMany({
        where: { loanId, settledAt: null },
        orderBy: { seq: "asc" },
        select: { id: true, seq: true, amountDue: true, amountPaid: true },
      });
      const nextDue = unsettled[0];
      if (!nextDue) throw new StudentPaymentError("NOTHING_OUTSTANDING");

      // Capped at what is still owed: decidePayment refuses to confirm an overpayment, and while one
      // waited for review it would block every corrected submission. A surplus exists only once
      // every installment is filled, so amount - surplus is the whole remaining balance.
      const { surplus } = allocatePayment(unsettled, amount);
      if (surplus > 0) throw new StudentPaymentError("AMOUNT_EXCEEDS_REMAINING", amount - surplus);

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
          actorStudentCode: studentCode,
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
