import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { computeFundCapacity, type FundCapacity, type OpenLoanMoney } from "@/lib/fund-budget";
import type { FundTransactionKindInput } from "@/lib/loan-validation";
import type { TxClient } from "./notifications";

const CLOSED_LOAN_STATUSES = ["closed", "rejected", "cancelled"] as const;

/**
 * Reads balance + open loans and applies computeFundCapacity. Pass the transaction client from a
 * Serializable transaction when the result guards a write, so concurrent writes can't both pass.
 * `excludeLoanId` leaves one loan out (a resubmit replaces that loan's own reservation).
 */
export async function getFundCapacity(
  db: TxClient = prisma,
  excludeLoanId?: string,
): Promise<FundCapacity> {
  const [totals, loans, ledger] = await Promise.all([
    db.fundTransaction.groupBy({ by: ["direction"], _sum: { amount: true } }),
    db.loanRequest.findMany({
      where: {
        status: { notIn: [...CLOSED_LOAN_STATUSES] },
        ...(excludeLoanId ? { id: { not: excludeLoanId } } : {}),
      },
      select: { id: true, status: true, amount: true, approvedAmount: true },
    }),
    db.fundTransaction.groupBy({
      by: ["loanId", "kind"],
      where: { kind: { in: ["disbursement", "repayment"] }, loan: { status: "disbursed" } },
      _sum: { amount: true },
    }),
  ]);

  const balance = totals.reduce((total, row) => total + (row._sum.amount ?? 0) * row.direction, 0);
  const openLoans = new Map<string, OpenLoanMoney>(
    loans.map((loan) => [loan.id, { ...loan, disbursed: 0, repaid: 0 }]),
  );
  for (const row of ledger) {
    const loan = row.loanId ? openLoans.get(row.loanId) : undefined;
    if (!loan) continue;
    if (row.kind === "disbursement") loan.disbursed += row._sum.amount ?? 0;
    else loan.repaid += row._sum.amount ?? 0;
  }
  return computeFundCapacity(balance, [...openLoans.values()]);
}

// direction is server-derived, never taken from the caller - see the pairing CHECK in
// db/migrations/20260911120000_fund_ledger_invariants/migration.sql.
const KIND_DIRECTION: Record<FundTransactionKindInput, 1 | -1> = {
  top_up: 1,
  withdrawal: -1,
  credit_adjustment: 1,
  debit_adjustment: -1,
};

export const fundTransactionSelect = {
  id: true,
  kind: true,
  amount: true,
  direction: true,
  loanId: true,
  performedBy: true,
  slipPath: true,
  note: true,
  createdAt: true,
} satisfies Prisma.FundTransactionSelect;

export async function getStudentLoanLimit(studentId: string): Promise<number> {
  const returned = await prisma.loanRequest.findFirst({
    where: { studentId, status: "returned" },
    select: { id: true },
  });
  const { available } = await getFundCapacity(prisma, returned?.id);
  return Math.max(0, available);
}

export async function getFundBalance() {
  const totals = await prisma.fundTransaction.groupBy({
    by: ["direction"],
    _sum: { amount: true },
  });
  return totals.reduce((total, row) => total + (row._sum.amount ?? 0) * row.direction, 0);
}

export async function listFundTransactions() {
  return prisma.fundTransaction.findMany({
    select: fundTransactionSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export type FundMutationErrorCode =
  | "ACCESS_REVOKED"
  | "INVALID_AMOUNT"
  | "REASON_REQUIRED"
  | "INSUFFICIENT_BALANCE"
  | "CAPACITY_EXCEEDED";

export class FundMutationError extends Error {
  constructor(
    readonly code: FundMutationErrorCode,
    // Set for CAPACITY_EXCEEDED: the most that could have been taken out.
    readonly available?: number,
  ) {
    super(code);
  }
}

export async function createFundTransaction({
  actorId,
  kind,
  amount,
  note,
}: {
  actorId: string;
  kind: FundTransactionKindInput;
  amount: number;
  note: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const effectiveRole = await tx.userRole.findFirst({
      where: { userId: actorId, role: "super_admin" },
      select: { userId: true },
    });
    if (!effectiveRole) throw new FundMutationError("ACCESS_REVOKED");

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new FundMutationError("INVALID_AMOUNT");
    }

    if (kind !== "top_up" && !note?.trim()) {
      throw new FundMutationError("REASON_REQUIRED");
    }

    // Cash left after money out must still cover every loan that may be paid out.
    if (KIND_DIRECTION[kind] === -1) {
      const { available } = await getFundCapacity(tx);
      if (amount > available) {
        throw new FundMutationError("CAPACITY_EXCEEDED", Math.max(0, available));
      }
    }

    let row;
    try {
      row = await tx.fundTransaction.create({
        data: {
          kind,
          amount,
          direction: KIND_DIRECTION[kind],
          performedBy: actorId,
          note,
        },
        select: fundTransactionSelect,
      });
    } catch (error) {
      // The AFTER INSERT balance-guard trigger raises this exact message on check_violation.
      const insufficientBalance =
        error instanceof Error && error.message.includes("fund_transaction: insufficient balance");
      if (insufficientBalance) throw new FundMutationError("INSUFFICIENT_BALANCE");
      throw error;
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: `fund_transaction.${kind}`,
        entityType: "fund_transaction",
        entityId: String(row.id),
        after: { kind: row.kind, amount: row.amount, direction: row.direction, note: row.note },
      },
    });

    return row;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
}
