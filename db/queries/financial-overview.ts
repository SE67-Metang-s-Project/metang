import { prisma } from "@/lib/prisma";
import type {
  ExecutiveFinancialOverviewData,
  FinancialOverviewPoint,
} from "@/lib/financial-overview-types";


export type { ExecutiveFinancialOverviewData, FinancialOverviewPoint };
export type ExecutiveFinancialOverviewResult = ExecutiveFinancialOverviewData;

const THAI_MONTH_NAMES = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

function formatThaiDateTime(date: Date): string {

  const day = date.getDate();
  const month = THAI_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes} น.`;
}

export function getZeroFinancialOverview(
  targetYear?: number,
): ExecutiveFinancialOverviewResult {

  const currentYear = targetYear ?? new Date().getFullYear();
  const monthly: FinancialOverviewPoint[] = THAI_MONTH_NAMES.map((label) => ({
    label,
    loans: 0,
    repayments: 0,
    loanCount: 0,
    repaymentCount: 0,
    transferredCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  }));

  const quarterly: FinancialOverviewPoint[] = [0, 1, 2, 3].map((quarterIndex) => ({
    label: `ไตรมาส ${quarterIndex + 1}`,
    loans: 0,
    repayments: 0,
    loanCount: 0,
    repaymentCount: 0,
    transferredCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  }));

  return {
    year: currentYear + 543,
    updatedAt: formatThaiDateTime(new Date()),
    totalSystem: 0,
    fundBalance: 0,
    approvedAmount: 0,
    approvedCount: 0,
    monthly,
    quarterly,
    totalLoans: 0,
    totalRepayments: 0,
    totalLoanCount: 0,
    totalRepaymentCount: 0,
  };
}

export async function getExecutiveFinancialOverviewData(
  targetYear?: number,
): Promise<ExecutiveFinancialOverviewResult> {
  const currentYear = targetYear ?? new Date().getFullYear();
  const yearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0));

  const [topUpAggregate, allFundTransactions, approvedLoansAggregate, yearLoans, yearPayments] =
    await Promise.all([
      // 1. Total capital injected into system
      prisma.fundTransaction.aggregate({
        where: { kind: "top_up" },
        _sum: { amount: true },
      }),

      // 2. All fund transactions for current balance
      prisma.fundTransaction.findMany({
        select: { amount: true, direction: true },
      }),

      // 3. Approved loans metric
      prisma.loanRequest.aggregate({
        where: {
          status: { in: ["pending_disbursement", "disbursed", "closed"] },
        },
        _sum: { approvedAmount: true },
        _count: { id: true },
      }),

      // 4. Annual loan requests breakdown
      prisma.loanRequest.findMany({
        where: {
          createdAt: { gte: yearStart, lt: yearEnd },
        },
        select: {
          amount: true,
          approvedAmount: true,
          status: true,
          createdAt: true,
        },
      }),

      // 5. Annual confirmed payments breakdown
      prisma.payment.findMany({
        where: {
          status: "confirmed",
          createdAt: { gte: yearStart, lt: yearEnd },
        },
        select: {
          amount: true,
          confirmedAt: true,
          createdAt: true,
        },
      }),
    ]);

  const totalSystem = topUpAggregate._sum.amount ?? 0;
  const fundBalance = allFundTransactions.reduce(
    (total, tx) => total + tx.amount * tx.direction,
    0,
  );
  const approvedAmount = approvedLoansAggregate._sum.approvedAmount ?? 0;
  const approvedCount = approvedLoansAggregate._count.id;

  // Initialize 12 monthly slots
  const monthly: FinancialOverviewPoint[] = THAI_MONTH_NAMES.map((label) => ({
    label,
    loans: 0,
    repayments: 0,
    loanCount: 0,
    repaymentCount: 0,
    transferredCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  }));

  for (const loan of yearLoans) {
    const month = new Date(loan.createdAt).getMonth();
    if (month >= 0 && month < 12) {
      monthly[month].loanCount += 1;

      if (
        loan.status === "disbursed" ||
        loan.status === "closed" ||
        loan.status === "pending_disbursement"
      ) {
        monthly[month].loans += loan.approvedAmount ?? loan.amount;
      }

      if (loan.status === "disbursed" || loan.status === "closed") {
        monthly[month].transferredCount += 1;
      } else if (loan.status === "rejected") {
        monthly[month].rejectedCount += 1;
      } else if (loan.status === "cancelled") {
        monthly[month].cancelledCount += 1;
      }
    }
  }

  for (const payment of yearPayments) {
    const paymentDate = payment.confirmedAt ?? payment.createdAt;
    const month = new Date(paymentDate).getMonth();
    if (month >= 0 && month < 12) {
      monthly[month].repayments += payment.amount;
      monthly[month].repaymentCount += 1;
    }
  }

  // Pre-aggregate quarterly breakdown (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
  const quarterly: FinancialOverviewPoint[] = [0, 1, 2, 3].map((quarterIndex) => {
    const quarterMonths = monthly.slice(quarterIndex * 3, quarterIndex * 3 + 3);
    return quarterMonths.reduce(
      (total, month) => ({
        label: `ไตรมาส ${quarterIndex + 1}`,
        loans: total.loans + month.loans,
        repayments: total.repayments + month.repayments,
        loanCount: total.loanCount + month.loanCount,
        repaymentCount: total.repaymentCount + month.repaymentCount,
        transferredCount: total.transferredCount + month.transferredCount,
        rejectedCount: total.rejectedCount + month.rejectedCount,
        cancelledCount: total.cancelledCount + month.cancelledCount,
      }),
      {
        label: `ไตรมาส ${quarterIndex + 1}`,
        loans: 0,
        repayments: 0,
        loanCount: 0,
        repaymentCount: 0,
        transferredCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
      },
    );
  });

  const totalLoans = monthly.reduce((total, item) => total + item.loans, 0);
  const totalRepayments = monthly.reduce((total, item) => total + item.repayments, 0);
  const totalLoanCount = monthly.reduce((total, item) => total + item.loanCount, 0);
  const totalRepaymentCount = monthly.reduce((total, item) => total + item.repaymentCount, 0);

  return {
    year: currentYear + 543,
    updatedAt: formatThaiDateTime(new Date()),
    totalSystem,
    fundBalance,
    approvedAmount,
    approvedCount,
    monthly,
    quarterly,
    totalLoans,
    totalRepayments,
    totalLoanCount,
    totalRepaymentCount,
  };
}
