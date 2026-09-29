import PendingPage from "@/components/executive/pending-advisor/PendingPage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getAdvisorQueuePage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

const EMPTY_PAGE = { items: [], total: 0, counts: { pending: 0, pendingExecutive: 0 } };

export default async function PendingAdvisorRequestsPage() {
  const context = await requireExecutiveAccess();
  // EXPERIMENT server-paging: page 1 of the initial filter; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const page = await getAdvisorQueuePage(context.user.id, { filter: "pending", page: 1, limit: 5 }).catch((error) => {
    console.error("Unable to load advisor requests for executive from DB", error);
    return EMPTY_PAGE;
  });

  return (
    <PendingPage
      initialRequests={page.items}
      serverQueue={{
        endpoint: "/api/executive/advisor-queue",
        initialTotal: page.total,
        initialCounts: page.counts,
      }}
    />
  );
}
