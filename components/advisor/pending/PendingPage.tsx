"use client";

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav"; // 1. Import TopNav ที่สร้างใหม่เข้ามา

import AdvisorStatCards from "@/components/advisor/dashboard/AdvisorStatCards";
import PendingRequestsList from "@/components/advisor/dashboard/RequestsList";

export default function PendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />
        <main className="p-6">
          <PendingRequestsList />
        </main>
      </div>
    </div>
  );
}
