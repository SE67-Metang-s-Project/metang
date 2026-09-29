import React from "react";
import VerifySlipPage from "@/components/admin/verify-slip/AdminVerifySlipPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getVerifySlipPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminAccess();
  // EXPERIMENT server-paging: first page only; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const { items: requests, total } = await getVerifySlipPage({ page: 1, limit: 5 }).catch((error) => {
    console.error("Unable to load admin verify-slip requests from DB", error);
    return { items: [], total: 0 };
  });

  return <VerifySlipPage initialRequests={requests} initialTotal={total} />;
}