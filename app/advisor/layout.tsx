import React from "react";
import { requireAdvisorAccess } from "@/lib/loan-auth";
import RoleShell from "@/components/shared/RoleShell";

export const dynamic = "force-dynamic";

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdvisorAccess();
  const userName = context.user.fullNameTh || context.identity.displayName || "อาจารย์ที่ปรึกษา";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "Advisor";
  const userEmail = context.user.email || context.identity.email || undefined;

  return (
    <RoleShell role="advisor" userName={userName} userId={userId} userEmail={userEmail}>
      {children}
    </RoleShell>
  );
}
