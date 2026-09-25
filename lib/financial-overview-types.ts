export type FinancialOverviewPoint = {
  label: string;
  loans: number;
  repayments: number;
  loanCount: number;
  repaymentCount: number;
  transferredCount: number;
  rejectedCount: number;
  cancelledCount: number;
};

export type ExecutiveFinancialOverviewData = {
  year: number;
  updatedAt: string;
  /** เงินทั้งหมดในระบบ: current balance + outstanding repayment (fundBalance + approvedAmount). */
  totalSystem: number;
  /** Current balance: cash on hand, the net of the whole fund ledger. */
  fundBalance: number;
  /** เงินที่อนุมัติไป: still owed on disbursed loans (ledger disbursed - repaid, per loan). */
  approvedAmount: number;
  /** Loans still being repaid (status disbursed). */
  approvedCount: number;
  monthly: FinancialOverviewPoint[];
  quarterly: FinancialOverviewPoint[];
  totalLoans: number;
  totalRepayments: number;
  totalLoanCount: number;
  totalRepaymentCount: number;
};
