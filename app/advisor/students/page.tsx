import StudentList from "@/components/advisor/students/AdvisorStudentPage";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import { getStudentsPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function StudentListPage() {
  const context = await requireAdvisorAccess();
  // EXPERIMENT server-paging: first page of students; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const { items: requests, total } = await getStudentsPage(
    { advisorId: context.user.id },
    { tab: "all", page: 1, limit: 5 },
  ).catch((error) => {
    console.error("Unable to load advisor student requests from DB", error);
    return { items: [], total: 0 };
  });

  return <StudentList initialRequests={requests} initialTotal={total} />;
}