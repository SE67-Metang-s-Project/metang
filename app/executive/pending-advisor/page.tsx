import PendingPage from "@/components/executive/pending-advisor/PendingPage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getAdvisorActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function PendingAdvisorRequestsPage() {
  const context = await requireExecutiveAccess();
  const requests = await getAdvisorActionRequests(context.user.id).catch((error) => {
    console.error("Unable to load advisor requests for executive from DB", error);
    return [];
  });

  return <PendingPage initialRequests={requests} />;
}