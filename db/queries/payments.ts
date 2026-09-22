import { Prisma } from "@/lib/generated/prisma/client";
import { allocatePayment } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
// Type-only, so this module still pulls in no prisma singleton at runtime. Prisma.TransactionClient
// describes the BASE client; lib/prisma exports an extended one, whose tx is not assignable to it.
import type { TxClient } from "./notifications";

export type PaymentApplicationErrorCode =
  | "NOT_FOUND"
  | "LOAN_NOT_DISBURSED"
  | "STALE_DECISION"
  | "ACCESS_REVOKED"
  | "DUPLICATE_REPAYMENT";

export class PaymentApplicationError extends Error {
  constructor(readonly code: PaymentApplicationErrorCode) {
    super(code);
  }
}

const applicationLoanSelect = {
  id: true,
  status: true,
  closedAt: true,
} satisfies Prisma.LoanRequestSelect;

/**
 * Applies an already-confirmed payment to its loan: fills installments (oldest, then last, then
 * the rest ascending), credits the fund, and closes the loan once nothing is outstanding.
 *
 * Runs inside a transaction the caller opens, because the payment's pending_review -> confirmed
 * CAS has to commit together with this write (NAT-33 owns that route). Two constraints the tx
 * seam hides from the type system:
 *  - the caller must open at Serializable with timeout 15000. TransactionClient cannot set its
 *    own isolation, and under Read Committed two concurrent confirms on one loan both read the
 *    same amountPaid and the second write silently loses the first.
 *  - every throw here has to unwind the caller's whole callback. A failed statement aborts the
 *    Postgres transaction and Prisma does not savepoint per statement, so treating
 *    DUPLICATE_REPAYMENT as an idempotent success and carrying on would run the rest of the
 *    callback against a dead transaction.
 */
export async function applyConfirmedPayment(
  tx: TxClient,
  { paymentId, actorId }: { paymentId: string; actorId: string },
) {
  const effectiveRole = await tx.userRole.findFirst({
    where: { userId: actorId, role: { in: ["admin", "super_admin"] } },
    select: { userId: true },
  });
  if (!effectiveRole) throw new PaymentApplicationError("ACCESS_REVOKED");

  // amount and loanId come from the row, never from a parameter: the ledger credit has to equal
  // the confirmed payment exactly, and a caller-supplied loanId could credit a different loan.
  const payment = await tx.payment.findFirst({
    where: { id: paymentId, status: "confirmed" },
    select: { id: true, loanId: true, amount: true },
  });
  if (!payment) throw new PaymentApplicationError("NOT_FOUND");

  const loan = await tx.loanRequest.findFirst({
    where: { id: payment.loanId, status: "disbursed" },
    select: applicationLoanSelect,
  });
  if (!loan) throw new PaymentApplicationError("LOAN_NOT_DISBURSED");

  const unsettled = await tx.installment.findMany({
    where: { loanId: payment.loanId, settledAt: null },
    orderBy: { seq: "asc" },
    select: { id: true, seq: true, amountDue: true, amountPaid: true },
  });

  const allocation = allocatePayment(unsettled, payment.amount);
  const appliedAt = new Date();

  for (const entry of allocation.allocations) {
    const changed = await tx.installment.updateMany({
      where: { id: entry.id, settledAt: null },
      data: { amountPaid: entry.amountPaid, settledAt: entry.settled ? appliedAt : null },
    });
    if (changed.count !== 1) throw new PaymentApplicationError("STALE_DECISION");
  }

  try {
    await tx.fundTransaction.create({
      data: {
        kind: "repayment",
        amount: payment.amount,
        direction: 1,
        loanId: payment.loanId,
        paymentId: payment.id,
        performedBy: actorId,
      },
    });
  } catch (error) {
    // fund_transaction_one_repayment_per_payment: this payment has already credited the fund.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PaymentApplicationError("DUPLICATE_REPAYMENT");
    }
    throw error;
  }

  if (allocation.closesLoan) {
    const closed = await tx.loanRequest.updateMany({
      where: { id: payment.loanId, status: "disbursed" },
      data: { status: "closed", closedAt: appliedAt },
    });
    if (closed.count !== 1) throw new PaymentApplicationError("STALE_DECISION");
  }

  const final = await tx.loanRequest.findUniqueOrThrow({
    where: { id: payment.loanId },
    select: applicationLoanSelect,
  });
  await tx.auditLog.create({
    data: {
      actorId,
      // Distinct from the "payment.confirmed" decision row written by decidePayment: this one
      // records the money actually moving, which is a different fact from the review outcome.
      action: "payment.applied",
      entityType: "payment",
      entityId: payment.id,
      before: serializeJson({ loan, installments: unsettled }),
      after: serializeJson({
        loan: final,
        allocations: allocation.allocations,
        outstandingAfter: allocation.outstandingAfter,
        // Credited to the fund but not owed against any installment. Nothing else records it, so
        // this audit row is the only trace an admin can reconcile the overpayment from.
        surplus: allocation.surplus,
      }),
    },
  });

  return { loan: final, ...allocation };
}
