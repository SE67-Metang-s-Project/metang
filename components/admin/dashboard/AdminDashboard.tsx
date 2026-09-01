"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav"; // 1. Import TopNav ที่สร้างใหม่เข้าม

import WelcomeCard from "@/components/shared/WelcomeCard";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />
      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมินคนหล่อ"
          userId="Admin001"
        />

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          <div className="w-full">
            <WelcomeCard name="แอดมินคนหล่อ" description="ผู้ดูแลระบบ (Admin)" />
          </div>
        </div>
      </main>
    </div>
  );
}
