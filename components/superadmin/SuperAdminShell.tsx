"use client";

import React from "react";
import RoleShell from "@/components/shared/RoleShell";

interface SuperAdminShellProps {
  userName: string;
  userId: string;
  userEmail?: string;
  children: React.ReactNode;
}

export default function SuperAdminShell({
  userName,
  userId,
  userEmail,
  children,
}: SuperAdminShellProps) {
  return (
    <RoleShell
      role="superadmin"
      userName={userName}
      userId={userId}
      userEmail={userEmail}
    >
      {children}
    </RoleShell>
  );
}
