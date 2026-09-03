"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import WelcomeCard from "@/components/shared/WelcomeCard";
import pendingRequests from "@/components/admin/pending/AdminPendingPage";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมินคนหล่อ"
          userId="Admin001"
        />

        <main className="p-6">
          {/* Content Area */}
          <WelcomeCard name="แอดมินคนหล่อ" description="admin" />

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">รายการคำขอที่รอดำเนินการ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
