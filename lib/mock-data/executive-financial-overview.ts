export type ExecutiveFinancialMockData = {
  year: number;
  updatedAt: string;
  totalSystem: number;
  fundBalance: number;
  approvedAmount: number;
  approvedCount: number;
  monthly: Array<{ label: string; loans: number; repayments: number; loanCount: number; repaymentCount: number }>;
  totalLoans: number;
  totalRepayments: number;
  totalLoanCount: number;
  totalRepaymentCount: number;
};

const monthly = [
  ["ม.ค.", 44000, 27000, 6, 5], ["ก.พ.", 57000, 35000, 8, 7], ["มี.ค.", 40000, 25000, 5, 4],
  ["เม.ย.", 45000, 23000, 6, 4], ["พ.ค.", 48000, 32000, 7, 6], ["มิ.ย.", 50000, 32000, 7, 6],
  ["ก.ค.", 41000, 25000, 6, 5], ["ส.ค.", 33000, 21000, 5, 4], ["ก.ย.", 38000, 25000, 5, 5],
  ["ต.ค.", 36000, 26000, 5, 5], ["พ.ย.", 41000, 21000, 6, 4], ["ธ.ค.", 31000, 24000, 4, 5],
].map(([label, loans, repayments, loanCount, repaymentCount]) => ({ label, loans, repayments, loanCount, repaymentCount }));

export function getMockExecutiveFinancialOverview(): ExecutiveFinancialMockData {
  return {
    year: 2568, updatedAt: "1 ก.ย. 2568 10:30 น.", totalSystem: 245600, fundBalance: 154800, approvedAmount: 90800, approvedCount: 42, monthly,
    totalLoans: monthly.reduce((total, item) => total + item.loans, 0),
    totalRepayments: monthly.reduce((total, item) => total + item.repayments, 0),
    totalLoanCount: monthly.reduce((total, item) => total + item.loanCount, 0),
    totalRepaymentCount: monthly.reduce((total, item) => total + item.repaymentCount, 0),
  };
}
