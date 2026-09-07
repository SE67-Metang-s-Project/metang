import ExecutivePendingPage from "@/components/executive/pending-executive/PendingExecutivePage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getExecutiveActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function ExecutivePendingRoute() {
  await requireExecutiveAccess();
  const requests = await getExecutiveActionRequests().catch((error) => {
    console.error("Unable to load executive pending requests from DB", error);
    return [];
  });

  return <ExecutivePendingPage initialRequests={requests} />;
}
