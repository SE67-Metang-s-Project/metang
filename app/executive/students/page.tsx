import ExecutiveStudentPage from "@/components/executive/students/ExecutiveStudentPage";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import { getStudentsPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function ExecutiveStudentsPage() {
  await requireExecutiveAccess();
  // EXPERIMENT server-paging: first page of students; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const { items: requests, total } = await getStudentsPage("all", { tab: "all", page: 1, limit: 5 }).catch(
    (error) => {
      console.error("Unable to load executive student requests from DB", error);
      return { items: [], total: 0 };
    },
  );

  return <ExecutiveStudentPage initialRequests={requests} initialTotal={total} />;
}