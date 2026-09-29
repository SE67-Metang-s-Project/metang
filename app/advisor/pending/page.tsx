import PendingPage from "@/components/advisor/pending/PendingPage";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import { getAdvisorQueuePage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

const EMPTY_PAGE = { items: [], total: 0, counts: { pending: 0, pendingExecutive: 0 } };

type PendingRequestsPageProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function PendingRequestsPage({ searchParams }: PendingRequestsPageProps) {
  const context = await requireAdvisorAccess();
  const { requestId } = await searchParams;
  // EXPERIMENT server-paging: page 1 of the initial filter; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const page = await getAdvisorQueuePage(context.user.id, {
      filter: requestId ? "all" : "pending",
      page: 1,
      limit: 5,
      focusId: requestId,
    }).catch((error) => {
    console.error("Unable to load advisor requests from DB", error);
    return EMPTY_PAGE;
  });

  return (
    <PendingPage
      initialRequests={page.items}
      highlightRequestId={requestId}
      serverQueue={{
        endpoint: "/api/advisor/queue",
        initialTotal: page.total,
        initialCounts: page.counts,
      }}
    />
  );
}
