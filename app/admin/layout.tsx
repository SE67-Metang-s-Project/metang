import React from "react";
import { requireAdminAccess } from "@/lib/loan-auth";
import RoleShell from "@/components/shared/RoleShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminAccess();
  const userName = context.user.fullNameTh || context.identity.displayName || "ผู้ดูแลระบบ";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "Admin";
  const userEmail = context.user.email || context.identity.email || undefined;

  return (
    <RoleShell role="admin" userName={userName} userId={userId} userEmail={userEmail}>
      {children}
    </RoleShell>
  );
}
