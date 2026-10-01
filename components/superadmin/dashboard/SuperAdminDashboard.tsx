import FinancialOverview from "@/components/shared/financial/FinancialOverview";
import WelcomeCard from "@/components/shared/WelcomeCard";

import type { ExecutiveFinancialOverviewData } from "@/lib/financial-overview-types";

type SuperAdminDashboardProps = {
  financialOverview?: ExecutiveFinancialOverviewData;
  userName?: string;
};

export default function SuperAdminDashboard({
  financialOverview,
  userName = "ผู้ดูแลระบบสูงสุด",
}: SuperAdminDashboardProps = {}) {
  return (
    <div className="space-y-10">
      <WelcomeCard name={userName} description="ผู้ดูแลระบบสูงสุด" />
      <section className="w-full font-[family-name:var(--font-kanit)]">
        <FinancialOverview
          initialData={financialOverview}
          apiUrl="/api/superadmin/financial-overview"
        />
      </section>
    </div>
  );
}
