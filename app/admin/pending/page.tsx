import AdminPendingPage from "@/components/admin/pending/AdminPendingPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

type PendingRequestsPageProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function PendingRequestsPage({ searchParams }: PendingRequestsPageProps) {
  await requireAdminAccess();
  const { requestId } = await searchParams;
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load admin pending requests from DB", error);
    return [];
  });

  return <AdminPendingPage initialRequests={requests} highlightRequestId={requestId} />;
}