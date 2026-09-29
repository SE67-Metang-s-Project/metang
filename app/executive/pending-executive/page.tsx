import ExecutivePendingPage from "@/components/executive/pending-executive/PendingExecutivePage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getExecutiveQueuePage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

const EMPTY_PAGE = { items: [], total: 0, counts: { pending: 0, pendingExecutive: 0 } };

type ExecutivePendingRouteProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function ExecutivePendingRoute({ searchParams }: ExecutivePendingRouteProps) {
  await requireExecutiveAccess();
  const { requestId } = await searchParams;
  // EXPERIMENT server-paging: page 1 of the initial filter; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const page = await getExecutiveQueuePage({
      filter: requestId ? "all" : "pending",
      page: 1,
      limit: 5,
      focusId: requestId,
    }).catch((error) => {
    console.error("Unable to load executive pending requests from DB", error);
    return EMPTY_PAGE;
  });

  return (
    <ExecutivePendingPage
      initialRequests={page.items}
      highlightRequestId={requestId}
      serverQueue={{
        endpoint: "/api/executive/queue",
        initialTotal: page.total,
        initialCounts: page.counts,
      }}
    />
  );
}
