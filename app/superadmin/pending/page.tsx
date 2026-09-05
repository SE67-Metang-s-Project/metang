import SuperAdminPendingPage from "@/components/superadmin/pending/SuperAdminRequestsPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function PendingRequestsPage() {
  await requireSuperAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load superadmin requests from DB", error);
    return [];
  });

  return <SuperAdminPendingPage initialRequests={requests} />;
}
