import SuperAdminPendingPage from "@/components/superadmin/pending/SuperAdminRequestsPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function PendingRequestsPage() {
  const context = await requireSuperAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load superadmin requests from DB", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName;
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";

  return (
    <SuperAdminPendingPage
      userName={userName}
      userId={userId}
      initialRequests={requests}
    />
  );
}
