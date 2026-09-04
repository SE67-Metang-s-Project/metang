"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav"; // 1. Import TopNav ที่สร้างใหม่เข้ามา

import PendingRequestsList from "./RequestsList";

export default function PendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />
        <main className="p-6">
          {/* <h2 className="text-lg font-semibold mb-4">รายการคำขอที่รอดำเนินการ</h2>
          <p className="text-gray-600 mb-6">รายการคำขอที่รอการพิจารณาจากอาจารย์ที่ปรึกษา</p> */}
          {/* แสดงรายการคำขอที่รอดำเนินการ */}
          <PendingRequestsList />
        </main>
      </div>
    </div>
  );
}
