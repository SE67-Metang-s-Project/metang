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
  totalSystem: number;
  fundBalance: number;
  approvedAmount: number;
  approvedCount: number;
  monthly: FinancialOverviewPoint[];
  quarterly: FinancialOverviewPoint[];
  totalLoans: number;
  totalRepayments: number;
  totalLoanCount: number;
  totalRepaymentCount: number;
};
