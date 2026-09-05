import React from "react";
import { requireExecutiveAccess } from "@/lib/loan-auth";
import RoleShell from "@/components/shared/RoleShell";

export const dynamic = "force-dynamic";

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireExecutiveAccess();
  const userName = context.user.fullNameTh || context.identity.displayName || "ผู้บริหาร";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "Executive";
  const userEmail = context.user.email || context.identity.email || undefined;

  return (
    <RoleShell role="executive" userName={userName} userId={userId} userEmail={userEmail}>
      {children}
    </RoleShell>
  );
}
