import SuperAdminPendingPage from "@/components/superadmin/pending/SuperAdminRequestsPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

type PendingRequestsPageProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function PendingRequestsPage({ searchParams }: PendingRequestsPageProps) {
  await requireSuperAdminAccess();
  const { requestId } = await searchParams;
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load superadmin requests from DB", error);
    return [];
  });

  return <SuperAdminPendingPage initialRequests={requests} highlightRequestId={requestId} />;
}
