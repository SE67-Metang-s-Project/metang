export type FundLedgerKind =
  | "top_up"
  | "withdrawal"
  | "credit_adjustment"
  | "debit_adjustment"
  | "disbursement"
  | "repayment";

export type FundBudgetTransaction = {
  kind: FundLedgerKind;
  amount: number;
};

export type FundBudgetOverview = {
  balance: number;
  transactions: FundBudgetTransaction[];
  pendingDisbursement: number;
};

export type FundBudgetTotals = {
  spentAmount: number;
  pendingAmount: number;
  remainingBudget: number;
  // วงเงินรวม (baseline for the adjustment form) reconstructed from remaining + spent + pending,
  // since the fund ledger only tracks a running balance, not a separate budget cap.
  currentTotal: number;
};

// Direction of each capital-adjustment kind, mirroring KIND_DIRECTION in
// db/queries/fund-transactions.ts. disbursement/repayment are loan activity, not capital
// SuperAdmin injected/withdrew, so they're excluded from this map on purpose.
const CAPITAL_ADJUSTMENT_DIRECTION: Partial<Record<FundLedgerKind, 1 | -1>> = {
  top_up: 1,
  credit_adjustment: 1,
  withdrawal: -1,
  debit_adjustment: -1,
};

export function computeFundBudgetTotals(overview: FundBudgetOverview): FundBudgetTotals {
  const spentAmount = overview.transactions
    .filter((t) => t.kind === "disbursement")
    .reduce((total, t) => total + t.amount, 0);
  const pendingAmount = overview.pendingDisbursement;
  const remainingBudget = overview.balance;
  // วงเงินรวม (baseline for the adjustment form) is the cumulative net of manual capital
  // transactions only (top_up/withdrawal/credit_adjustment/debit_adjustment). It must NOT be
  // reconstructed as remainingBudget + spentAmount + pendingAmount: `balance` already nets in
  // "repayment"-kind transactions, so adding spentAmount back on top double-counts every repaid
  // baht once a loan-repayment flow starts writing repayment transactions.
  const currentTotal = overview.transactions.reduce((total, t) => {
    const direction = CAPITAL_ADJUSTMENT_DIRECTION[t.kind];
    return direction ? total + direction * t.amount : total;
  }, 0);

  return { spentAmount, pendingAmount, remainingBudget, currentTotal };
}

export function computeUsagePercentage(totals: Pick<FundBudgetTotals, "spentAmount" | "pendingAmount" | "currentTotal">) {
  if (totals.currentTotal <= 0) return 0;
  return Math.min(100, ((totals.spentAmount + totals.pendingAmount) / totals.currentTotal) * 100);
}

export type FundAdjustmentKind = "credit_adjustment" | "debit_adjustment";

/**
 * Resolves an edited "วงเงินรวม" target back into a ledger adjustment.
 * Returns null when there is nothing to save (target === currentTotal).
 */
export function resolveFundAdjustment(
  targetTotal: number,
  currentTotal: number,
): { kind: FundAdjustmentKind; amount: number } | null {
  const delta = targetTotal - currentTotal;
  if (delta === 0) return null;
  return delta > 0
    ? { kind: "credit_adjustment", amount: delta }
    : { kind: "debit_adjustment", amount: -delta };
}

export function mapFundTransactionError(status: number, errorCode: string | undefined, fallback: string) {
  if (status === 401) return "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
  if (status === 403) return "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
  if (status === 409) {
    return errorCode === "INSUFFICIENT_FUNDS"
      ? "ยอดคงเหลือไม่สามารถติดลบได้"
      : fallback || "เกิดข้อขัดแย้ง กรุณาลองใหม่";
  }
  if (status === 422) return fallback || "ข้อมูลไม่ถูกต้อง";
  return fallback || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
}
