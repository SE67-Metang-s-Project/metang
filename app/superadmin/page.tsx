import SuperAdminDashboard from "@/components/superadmin/dashboard/SuperAdminDashboard";
import { getExecutiveFinancialOverviewData } from "@/db/queries/financial-overview";
import { getAdminActionRequests } from "@/db/queries/loan-requests";
import { listUsersWithRoles } from "@/db/queries/users";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const context = await requireSuperAdminAccess();

  const [financialOverview, rawRequests, rawUsers] = await Promise.all([
    getExecutiveFinancialOverviewData().catch((error) => {
      console.error("Unable to load financial overview from DB for SuperAdmin", error);
      return undefined;
    }),
    getAdminActionRequests().catch((error) => {
      console.error("Unable to load admin action requests for SuperAdmin dashboard", error);
      return [];
    }),
    listUsersWithRoles().catch((error) => {
      console.error("Unable to load users with roles for SuperAdmin dashboard", error);
      return [];
    }),
  ]);

  const userName = context.user.fullNameTh || context.identity.displayName || "SuperAdmin";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";
  const currentUserId = context.user.id;

  return (
    <SuperAdminDashboard
      userName={userName}
      userId={userId}
      currentUserId={currentUserId}
      financialOverview={financialOverview}
      initialRequests={rawRequests}
      initialUsers={serializeJson(rawUsers)}
    />
  );
}

