// app/advisor/students/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง

import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type AdvisorStudentPageProps = {
  userName?: string;
  userId?: string;
  initialRequests?: ActionRequest[];
};

export default function AdvisorStudentPage({
  userName = "อาจารย์ที่ปรึกษา",
  userId = "Advisor",
  initialRequests = [],
}: AdvisorStudentPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      <main className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">นักศึกษาในความดูแล</h1>
            <p className="text-sm text-gray-500 mt-1">
              รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแล
            </p>
          </div>

          {/* เรียก Shared Component และส่งข้อมูลของฝั่ง Advisor เข้าไป */}
          <SharedStudentList rawRequests={initialRequests} />
        </main>
      </div>
    </div>
  );
}
