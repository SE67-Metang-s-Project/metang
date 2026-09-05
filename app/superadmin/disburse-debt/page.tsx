import DisburseDebtPage from "@/components/superadmin/disburse-debt/DisburseDebtPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getDisbursementActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function DisburseDebt() {
  const context = await requireSuperAdminAccess();
  const requests = await getDisbursementActionRequests().catch((error) => {
    console.error("Unable to load disbursement requests from DB", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName;
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";

  return (
    <DisburseDebtPage
      userName={userName}
      userId={userId}
      initialRequests={requests}
    />
  );
}