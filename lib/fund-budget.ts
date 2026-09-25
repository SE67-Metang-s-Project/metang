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

export type OpenLoanMoney = {
  status: string;
  // The student's requested amount (loan_request.amount).
  amount: number;
  approvedAmount: number | null;
  // From the fund ledger; both 0 until the loan is disbursed.
  disbursed: number;
  repaid: number;
};

export type FundCapacity = {
  // Cash on hand: the net of the whole fund ledger.
  balance: number;
  // Still owed on disbursed loans (ledger disbursed - repaid, never below 0 per loan).
  outstanding: number;
  // Money the fund will hold once every repayment is in: balance + outstanding. Display only -
  // repayments not received yet can't pay out a loan, so the rule below uses cash.
  totalSystem: number;
  // Money that may still leave the fund (see computeFundCapacity).
  reserved: number;
  // balance - reserved: what may still be withdrawn or requested. Negative when the fund already
  // sits below open requests; then every withdrawal and new request is refused.
  available: number;
  // Loans still being repaid (status disbursed).
  disbursedLoanCount: number;
};

/**
 * Fund capacity rule: cash on hand must always cover every loan that may still be paid out, so a
 * disbursement can never fail for lack of money (0 cash => no open request can exist).
 * SuperAdmin may withdraw at most `available`, and a student may request at most `available`.
 *
 * `openLoans` = loans not closed/rejected/cancelled. Disbursed ones only feed `outstanding` (their
 * money already left). The rest reserve the most that can still leave:
 *   - pending_disbursement: approvedAmount (final; exactly what the payout transfers)
 *   - draft, returned, pending_advisor, pending_admin, pending_executive: amount (an executive
 *     return clears approvedAmount and the admin may re-approve up to the full amount)
 * A payout lowers balance and reserved by the same approvedAmount, so `available` is unchanged;
 * decisions, cancels and repayments only keep or raise it.
 */
export function computeFundCapacity(balance: number, openLoans: OpenLoanMoney[]): FundCapacity {
  let outstanding = 0;
  let reserved = 0;
  let disbursedLoanCount = 0;
  for (const loan of openLoans) {
    if (loan.status === "disbursed") {
      disbursedLoanCount += 1;
      outstanding += Math.max(0, loan.disbursed - loan.repaid);
    } else if (loan.status === "pending_disbursement") {
      reserved += loan.approvedAmount ?? loan.amount;
    } else {
      reserved += loan.amount;
    }
  }
  return {
    balance,
    outstanding,
    totalSystem: balance + outstanding,
    reserved,
    available: balance - reserved,
    disbursedLoanCount,
  };
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

// Always returns curated Thai copy - the backend's raw error.message (English, e.g. "A note
// is required for this transaction kind") must never be shown as-is in this all-Thai UI, so it
// is intentionally not used here.
export function mapFundTransactionError(status: number, errorCode: string | undefined, _fallback?: string) {
  if (status === 401) return "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
  if (status === 403) return "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
  if (status === 409) {
    return errorCode === "INSUFFICIENT_FUNDS"
      ? "ยอดคงเหลือไม่สามารถติดลบได้"
      : "เกิดข้อขัดแย้ง กรุณาลองใหม่";
  }
  if (status === 422) return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบจำนวนเงินและเหตุผล";
  return "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
}
