import DisburseDebtPage from "@/components/superadmin/disburse-debt/DisburseDebtPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getDisbursementActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function DisburseDebt() {
  await requireSuperAdminAccess();
  const requests = await getDisbursementActionRequests().catch((error) => {
    console.error("Unable to load disbursement requests from DB", error);
    return [];
  });

  return <DisburseDebtPage initialRequests={requests} />;
}