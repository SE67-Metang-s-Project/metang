// app/advisor/students/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง

// นำเข้าข้อมูล Mock Data
import { mockAdvisorRequests } from "@/components/shared/mock-data/mockAdvisorRequests";

export default function AdvisorStudentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      <main className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold text-[#1e293b]">นักศึกษาในความดูแล</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแล
            </p>
          </div>

          {/* เรียก Shared Component และส่งข้อมูลของฝั่ง Advisor เข้าไป */}
          <SharedStudentList rawRequests={mockAdvisorRequests} />
        </div>
      </main>
    </div>
  );
}
