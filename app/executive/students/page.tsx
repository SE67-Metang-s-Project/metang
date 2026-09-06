import ExecutiveStudentPage from "@/components/executive/students/ExecutiveStudentPage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getExecutiveActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function ExecutiveStudentsPage() {
  await requireExecutiveAccess();
  const requests = await getExecutiveActionRequests().catch((error) => {
    console.error("Unable to load executive student requests from DB", error);
    return [];
  });

  return <ExecutiveStudentPage initialRequests={requests} />;
}