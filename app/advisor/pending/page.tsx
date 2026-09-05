import PendingPage from "@/components/advisor/pending/PendingPage";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import { getAdvisorActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function PendingRequestsPage() {
  const context = await requireAdvisorAccess();
  const requests = await getAdvisorActionRequests(context.user.id).catch((error) => {
    console.error("Unable to load advisor requests from DB", error);
    return [];
  });

  return <PendingPage initialRequests={requests} />;
}
