// app/superadmin/pending/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList"; // เรียกตัวกลาง

export default function SuperAdminPendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="Super Admin สูงสุด"
          userId="SA-001"
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">คำร้องรอพิจารณา (Super Admin)</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ตรวจสอบคำร้องและปรับแก้วงเงิน (สิทธิ์ผู้ดูแลระบบระดับสูง)
            </p>
          </div>

          {/* ส่ง userRole="super_admin" ไปให้ทำงานแบบ Super Admin */}
          <SharedRequestsList userRole="super_admin" />
        </main>
      </div>
    </div>
  );
}
