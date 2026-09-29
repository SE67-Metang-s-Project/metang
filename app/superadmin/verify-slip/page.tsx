import VerifySlipPage from "@/components/superadmin/verify-slip/SuperAdminVerifySlipPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { getVerifySlipPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireSuperAdminAccess();
  // EXPERIMENT verify-slip-paging: first page only; the list fetches the rest (revert: EXPERIMENT-verify-slip-paging.local.md)
  const { items: requests, total } = await getVerifySlipPage({ page: 1, limit: 5 }).catch((error) => {
    console.error("Unable to load verify-slip requests from DB", error);
    return { items: [], total: 0 };
  });

  return <VerifySlipPage initialRequests={requests} initialTotal={total} />;
}
