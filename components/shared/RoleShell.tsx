"use client";

import React, { useState } from "react";
import SideNav, { type UserRole } from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

export interface RoleShellProps {
  role: UserRole;
  userName: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  children: React.ReactNode;
}

export default function RoleShell({
  role,
  userName,
  userId,
  userRole,
  userEmail,
  children,
}: RoleShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={role}
      />

      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
          role={role}
          userRole={userRole}
          userEmail={userEmail}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
