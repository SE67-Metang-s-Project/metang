import React from "react";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import SuperAdminShell from "@/components/superadmin/SuperAdminShell";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireSuperAdminAccess();
  const userName = context.user.fullNameTh || context.identity.displayName || "SuperAdmin";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";
  const userEmail = context.user.email || context.identity.email || undefined;

  return (
    <SuperAdminShell userName={userName} userId={userId} userEmail={userEmail}>
      {children}
    </SuperAdminShell>
  );
}
