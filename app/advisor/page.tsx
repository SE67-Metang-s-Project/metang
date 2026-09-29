import AdvisorDashboard from "@/components/advisor/dashboard/AdvisorDashboard";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import { getAdvisorDashboardRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function AdvisorPage() {
  const context = await requireAdvisorAccess();
  const requests = await getAdvisorDashboardRequests(context.user.id).catch((error) => {
    console.error("Unable to load advisor requests from DB", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName;

  return (
    <AdvisorDashboard
      userName={userName}
      initialRequests={requests}
    />
  );
}
