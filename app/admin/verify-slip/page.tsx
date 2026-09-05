import React from "react";
import VerifySlipPage from "@/components/admin/verify-slip/AdminVerifySlipPage";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getAdminActionRequests } from "@/db/queries/loan-requests";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminAccess();
  const requests = await getAdminActionRequests().catch((error) => {
    console.error("Unable to load admin verify-slip requests from DB", error);
    return [];
  });

  return <VerifySlipPage initialRequests={requests} />;
}