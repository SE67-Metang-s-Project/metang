import { Prisma } from "@/lib/generated/prisma/client";
import type { PaymentDecision } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";
import { withSlipFlag } from "./loan-requests";
import { applyConfirmedPayment } from "./payments";

/**
 * Admin/SuperAdmin review of a student's repayment slip. Kept out of db/queries/payments.ts on
 * purpose: that module never imports the prisma singleton, which is what lets
 * applyConfirmedPayment be composed into whatever transaction its caller opens.
 */
const adminPaymentSelect = {
  id: true,
  loanId: true,
  installmentId: true,
  amount: true,
  status: true,
  paidAt: true,
  confirmedBy: true,
  confirmedAt: true,
  reviewNote: true,
  createdAt: true,
  // Stripped by withSlipFlag before anything is returned - the reviewer opens the slip through
  // GET /api/payments/{id}/slip, never by storage path.
  slipPath: true,
  loan: {
    select: {
      id: true,
      status: true,
      student: {
        select: {
          id: true,
          studentCode: true,
          fullNameTh: true,
          fullNameEn: true,
          phone: true,
        },
      },
    },
  },
  // The installment the student aimed at, so the reviewer can judge the amount against what is due.
  installment: {
    select: { id: true, seq: true, dueDate: true, amountDue: true, amountPaid: true },
  },
} satisfies Prisma.PaymentSelect;

export async function getAdminPaymentQueue() {
  const payments = await prisma.payment.findMany({
    where: { status: "pending_review" },
    select: adminPaymentSelect,
    // Oldest first: a review queue is FIFO, unlike the loan queues which surface newest first.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return payments.map(withSlipFlag);
}

export async function getAdminPaymentDetail(id: string) {
  const payment = await prisma.payment.findUnique({ where: { id }, select: adminPaymentSelect });
  return payment ? withSlipFlag(payment) : null;
}

export type PaymentDecisionErrorCode = "NOT_FOUND" | "STALE_DECISION" | "ACCESS_REVOKED";

export class PaymentDecisionError extends Error {
  constructor(readonly code: PaymentDecisionErrorCode) {
    super(code);
  }
}

/**
 * Records a reviewer's confirm/reject on a pending payment, and on a confirmation applies the money
 * in the same transaction. Serializable because applyConfirmedPayment cannot set its own isolation
 * and a lost amountPaid update between two concurrent confirms would silently under-record a
 * repayment.
 */
export async function decidePayment({
  paymentId,
  adminId,
  decision,
  note,
}: {
  paymentId: string;
  adminId: string;
  decision: PaymentDecision;
  note: string | null;
}) {
  return prisma.$transaction(
    async (tx) => {
      const effectiveRole = await tx.userRole.findFirst({
        where: { userId: adminId, role: { in: ["admin", "super_admin"] } },
        select: { userId: true },
      });
      if (!effectiveRole) throw new PaymentDecisionError("ACCESS_REVOKED");

      // Read by id alone, then check the status separately: filtering on pending_review here would
      // report an already-reviewed payment as NOT_FOUND, telling the caller it does not exist.
      // A second decision is a conflict, not a missing row.
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        select: adminPaymentSelect,
      });
      if (!current) throw new PaymentDecisionError("NOT_FOUND");
      if (current.status !== "pending_review") throw new PaymentDecisionError("STALE_DECISION");

      const changed = await tx.payment.updateMany({
        where: { id: paymentId, status: "pending_review" },
        data: {
          status: decision,
          confirmedBy: adminId,
          confirmedAt: new Date(),
          reviewNote: note,
        },
      });
      if (changed.count !== 1) throw new PaymentDecisionError("STALE_DECISION");

      // Must follow the CAS: applyConfirmedPayment reads the row back with status "confirmed", so
      // calling it first would find nothing. It settles installments, credits the fund, and closes
      // the loan when nothing is outstanding.
      if (decision === "confirmed") {
        await applyConfirmedPayment(tx, { paymentId, actorId: adminId });
      }

      const final = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: adminPaymentSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `payment.${decision}`,
          entityType: "payment",
          entityId: paymentId,
          before: serializeJson(withSlipFlag(current)),
          after: serializeJson(withSlipFlag(final)),
        },
      });
      return withSlipFlag(final);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
  );
}
