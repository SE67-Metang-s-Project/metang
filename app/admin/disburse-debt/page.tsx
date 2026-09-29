import React from "react";
import DisburseDebtPage from "@/components/admin/disburse-debt/DisburseDebtPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getDisbursementPage } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function DisburseDebt() {
  await requireAdminAccess();
  // EXPERIMENT server-paging: first page of the "all" tab; the list fetches the rest
  // (revert: EXPERIMENT-server-paging.local.md)
  const { items: requests, total } = await getDisbursementPage({ tab: "all", page: 1, limit: 5 }).catch((error) => {
    console.error("Unable to load admin disbursement requests from DB", error);
    return { items: [], total: 0 };
  });

  return <DisburseDebtPage initialRequests={requests} initialTotal={total} />;
}