import SuperAdminDashboard from "@/components/superadmin/dashboard/SuperAdminDashboard";
import { getExecutiveFinancialOverviewData } from "@/db/queries/financial-overview";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const financialOverview = await getExecutiveFinancialOverviewData().catch((error) => {
    console.error("Unable to load financial overview from DB for SuperAdmin", error);
    return undefined;
  });

  return <SuperAdminDashboard financialOverview={financialOverview} />;
}

