import SuperAdminDashboard from "@/components/superadmin/dashboard/SuperAdminDashboard";
import {
  getExecutiveFinancialOverviewData,
  getZeroFinancialOverview,
} from "@/db/queries/financial-overview";
import { requireSuperAdminAccess } from "@/lib/loan-auth";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requireSuperAdminAccess();

  const financialOverview = await getExecutiveFinancialOverviewData().catch((error) => {
    console.error("Unable to load financial overview from DB for SuperAdmin", error);
    return getZeroFinancialOverview();
  });

  return (
    <SuperAdminDashboard financialOverview={financialOverview} />
  );
}
