import AdminPendingPage from "@/components/admin/pending/AdminPendingPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function PendingRequestsPage() {
  await requireAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load admin pending requests from DB", error);
    return [];
  });

  return <AdminPendingPage initialRequests={requests} />;
}