import VerifySlipPage from "@/components/superadmin/verify-slip/SuperAdminVerifySlipPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireSuperAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load verify-slip requests from DB", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName;
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";

  return (
    <VerifySlipPage
      userName={userName}
      userId={userId}
      initialRequests={requests}
    />
  );
}
