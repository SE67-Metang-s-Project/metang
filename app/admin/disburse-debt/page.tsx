import React from "react";
import DisburseDebtPage from "@/components/admin/disburse-debt/DisburseDebtPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getDisbursementActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function DisburseDebt() {
  await requireAdminAccess();
  const requests = await getDisbursementActionRequests().catch((error) => {
    console.error("Unable to load admin disbursement requests from DB", error);
    return [];
  });

  return <DisburseDebtPage initialRequests={requests} />;
}