"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import PendingRequestsList from "./AdminRequestsList";

export default function PendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        {/* เอา div ที่เคยครอบตรงนี้ออก แล้ววาง TopNav เลย */}
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        {/* แนะนำให้เพิ่มจัดกึ่งกลางและ padding ให้เหมือนหน้าอื่น */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          <PendingRequestsList />
        </main>
      </div>
    </div>
  );
}
