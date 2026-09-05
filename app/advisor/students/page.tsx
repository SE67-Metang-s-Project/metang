import StudentList from "@/components/advisor/students/AdvisorStudentPage";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import { getAdvisorActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function StudentListPage() {
  const context = await requireAdvisorAccess();
  const requests = await getAdvisorActionRequests(context.user.id).catch((error) => {
    console.error("Unable to load advisor student requests from DB", error);
    return [];
  });

  return <StudentList initialRequests={requests} />;
}