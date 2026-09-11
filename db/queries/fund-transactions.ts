import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { FundTransactionKindInput } from "@/lib/loan-validation";

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

export async function getFundBalance() {
  const rows = await prisma.fundTransaction.findMany({
    select: { amount: true, direction: true },
  });
  return rows.reduce((total, row) => total + row.amount * row.direction, 0);
}

export async function listFundTransactions() {
  return prisma.fundTransaction.findMany({
    select: fundTransactionSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export type FundMutationErrorCode =
  "ACCESS_REVOKED" | "INVALID_AMOUNT" | "REASON_REQUIRED" | "INSUFFICIENT_BALANCE";

export class FundMutationError extends Error {
  constructor(readonly code: FundMutationErrorCode) {
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
  });
}
