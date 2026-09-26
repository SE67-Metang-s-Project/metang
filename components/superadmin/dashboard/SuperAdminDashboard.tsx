import FinancialOverview from "@/components/shared/financial/FinancialOverview";

import type { ExecutiveFinancialOverviewData } from "@/lib/financial-overview-types";

type SuperAdminDashboardProps = {
  financialOverview?: ExecutiveFinancialOverviewData;
};

export default function SuperAdminDashboard({
  financialOverview,
}: SuperAdminDashboardProps = {}) {
  return (
    <section className="w-full font-[family-name:var(--font-kanit)]">
      <FinancialOverview
        initialData={financialOverview}
        apiUrl="/api/superadmin/financial-overview"
      />
    </section>
  );
}
