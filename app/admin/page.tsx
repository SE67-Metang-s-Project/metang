import AdminPage from "@/components/admin/dashboard/AdminDashboard";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getAdminDashboardRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const context = await requireAdminAccess();
  const rawRequests = await getAdminDashboardRequests(context.user.id).catch((error) => {
    console.error("Unable to load admin action requests for Admin dashboard", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName || "ผู้ดูแลระบบ";

  return <AdminPage userName={userName} initialRequests={rawRequests} />;
}