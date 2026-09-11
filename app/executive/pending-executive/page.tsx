import ExecutivePendingPage from "@/components/executive/pending-executive/PendingExecutivePage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getExecutiveActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

type ExecutivePendingRouteProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function ExecutivePendingRoute({ searchParams }: ExecutivePendingRouteProps) {
  await requireExecutiveAccess();
  const { requestId } = await searchParams;
  const requests = await getExecutiveActionRequests().catch((error) => {
    console.error("Unable to load executive pending requests from DB", error);
    return [];
  });

  return <ExecutivePendingPage initialRequests={requests} highlightRequestId={requestId} />;
}
