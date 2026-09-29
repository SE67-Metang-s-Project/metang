import DisburseDebtPage from "@/components/superadmin/disburse-debt/DisburseDebtPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getDisbursementPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function DisburseDebt() {
  await requireSuperAdminAccess();
  // EXPERIMENT disburse-debt-paging: first page only; the list fetches the rest (revert: EXPERIMENT-disburse-debt-paging.local.md)
  const { items: requests, total } = await getDisbursementPage({ tab: "all", page: 1, limit: 5 }).catch((error) => {
    console.error("Unable to load disbursement requests from DB", error);
    return { items: [], total: 0 };
  });

  return <DisburseDebtPage initialRequests={requests} initialTotal={total} />;
}