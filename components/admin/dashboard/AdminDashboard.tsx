"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

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
          {/* แก้ไข userName เป็น name ให้ตรงกับที่ WelcomeCard รับค่า */}
          <WelcomeCard name="แอดมินคนหล่อ" description="admin" />
        </main>
      </div>
    </div>
  );
}
