import VerifySlipPage from "@/components/superadmin/verify-slip/SuperAdminVerifySlipPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireSuperAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load verify-slip requests from DB", error);
    return [];
  });

  return <VerifySlipPage initialRequests={requests} />;
}
