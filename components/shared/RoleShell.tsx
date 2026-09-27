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
  const isStudent = role === "student";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {!isStudent && (
        <SideNav
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          role={role}
        />
      )}

      <div
        className={`flex-1 flex flex-col w-full min-h-screen ${
          !isStudent ? "min-[1576px]:ml-64" : ""
        } transition-all duration-300`}
      >
        <TopNav
          onOpenSidebar={!isStudent ? () => setIsSidebarOpen(true) : undefined}
          userName={userName}
          userId={userId}
          role={role}
          userRole={userRole}
          userEmail={userEmail}
          hasPersistentSidebar={!isStudent}
          showSidebarButton={!isStudent}
          showLogo={isStudent}
        />

        <main className="p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0 max-w-[1600px] w-full mx-auto">
          {children}
          <footer aria-hidden="true" className="h-20" />
        </main>
      </div>
    </div>
  );
}
