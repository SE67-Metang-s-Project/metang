import ExecutiveDashboard from "@/components/executive/dashboard/ExecutiveDashboard";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import {
  getExecutiveFinancialOverviewData,
  getZeroFinancialOverview,
} from "@/db/queries/financial-overview";

export const dynamic = "force-dynamic";

export default async function ExecutivePage() {
  const context = await requireExecutiveAccess();
  const financialOverview = await getExecutiveFinancialOverviewData().catch((error) => {
    console.error("Unable to load executive financial overview from DB", error);
    return getZeroFinancialOverview();
  });

  const userName = context.user.fullNameTh || context.identity.displayName;
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "Executive";

  return (
    <ExecutiveDashboard
      userName={userName}
      userId={userId}
      financialOverview={financialOverview}
    />
  );
}
