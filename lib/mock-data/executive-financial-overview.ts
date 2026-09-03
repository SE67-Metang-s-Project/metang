export type ExecutiveFinancialMockData = {
  year: number;
  updatedAt: string;
  totalSystem: number;
  fundBalance: number;
  approvedAmount: number;
  approvedCount: number;
  monthly: Array<{
    label: string;
    loans: number;
    repayments: number;
    loanCount: number;
    repaymentCount: number;
    transferredCount: number;
    rejectedCount: number;
    cancelledCount: number;
  }>;
  totalLoans: number;
  totalRepayments: number;
  totalLoanCount: number;
  totalRepaymentCount: number;
};

const monthlyRows: Array<[string, number, number, number, number, number, number, number]> = [
  ["ม.ค.", 44000, 27000, 6, 5, 6, 1, 0],
  ["ก.พ.", 57000, 35000, 8, 7, 8, 1, 1],
  ["มี.ค.", 40000, 25000, 5, 4, 5, 0, 1],
  ["เม.ย.", 45000, 23000, 6, 4, 6, 1, 0],
  ["พ.ค.", 48000, 32000, 7, 6, 7, 1, 1],
  ["มิ.ย.", 50000, 32000, 7, 6, 7, 0, 1],
  ["ก.ค.", 41000, 25000, 6, 5, 6, 1, 0],
  ["ส.ค.", 33000, 21000, 5, 4, 5, 0, 1],
  ["ก.ย.", 38000, 25000, 5, 5, 5, 1, 0],
  ["ต.ค.", 36000, 26000, 5, 5, 5, 1, 1],
  ["พ.ย.", 41000, 21000, 6, 4, 6, 0, 0],
  ["ธ.ค.", 31000, 24000, 4, 5, 4, 1, 0],
];

const monthly: ExecutiveFinancialMockData["monthly"] = monthlyRows.map(
  ([
    label,
    loans,
    repayments,
    loanCount,
    repaymentCount,
    transferredCount,
    rejectedCount,
    cancelledCount,
  ]) => ({
    label,
    loans,
    repayments,
    loanCount,
    repaymentCount,
    transferredCount,
    rejectedCount,
    cancelledCount,
  }),
);

export function getMockExecutiveFinancialOverview(): ExecutiveFinancialMockData {
  return {
    year: new Date().getFullYear() + 543,
    updatedAt: "1 ก.ย. 2568 10:30 น.",
    totalSystem: 245600,
    fundBalance: 154800,
    approvedAmount: 90800,
    approvedCount: 42,
    monthly,
    totalLoans: monthly.reduce((total, item) => total + item.loans, 0),
    totalRepayments: monthly.reduce((total, item) => total + item.repayments, 0),
    totalLoanCount: monthly.reduce((total, item) => total + item.loanCount, 0),
    totalRepaymentCount: monthly.reduce((total, item) => total + item.repaymentCount, 0),
  };
}
