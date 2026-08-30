"use client";

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav"; // 1. Import TopNav ที่สร้างใหม่เข้ามา

// Import กล่องต่างๆ ของเราเข้ามา
import AdvisorWelcomeCard from "./AdvisorWelcomeCard";
import AdvisorStatCards from "./AdvisorStatCards";
import PendingRequestsList from "./RequestsList";
import AdvisorRecentHistory from "./AdvisorRecentHistory";

export default function AdvisorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        
        {/* ดึงข้อมูลผู้ใช้งานจากระบบ (เช่น จาก Context หรือ API) เพื่อส่งไปยัง TopNav */} 
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          {/* ส่วนบนสุด: Welcome Card และสถิติ */}
          <div>
            <AdvisorWelcomeCard />
            {/* <AdvisorStatCards /> */}
          </div>

          {/* 1. รายการคำร้องที่ต้องพิจารณา */}
          <div className="w-full">
            <PendingRequestsList />
          </div>

          {/* 2. ประวัติการดำเนินการล่าสุด */}
          <div className="w-full">
            <AdvisorRecentHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
