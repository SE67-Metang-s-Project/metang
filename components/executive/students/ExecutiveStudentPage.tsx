// app/executive/students/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง

// สมมติว่าฝั่ง Executive ดึงข้อมูลนักศึกษาทั้งหมดในคณะ (ใช้ mockAdminRequests หรือ mock แยกต่างหาก)
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

export default function ExecutiveStudentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="executive" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="รศ.ดร. ประเสริฐ กิตติคุณ"
          userId="E9001"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              ข้อมูลนักศึกษาทั้งหมด
            </h1>
            <p className="text-[13px] text-gray-500">
              ภาพรวมรายชื่อและสถานะหนี้สินของนักศึกษาในคณะ
            </p>
          </div>

          {/* เรียก Shared Component และส่งข้อมูลทั้งหมดเข้าไป */}
          <SharedStudentList rawRequests={mockAdminRequests} />
        </div>
      </main>
    </div>
  );
}
