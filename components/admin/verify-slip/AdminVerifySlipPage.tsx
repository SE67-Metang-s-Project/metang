// app/admin/verify-slip/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
// เรียกใช้ Shared Component
import SharedVerifySlipList from "@/components/shared/verify-slip/SharedVerifySlipList";

export default function AdminVerifySlipPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="เจ้าหน้าที่ สมศรี"
          userId="S2001"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              ตรวจสอบสลิปชำระเงิน (Admin)
            </h1>
            <p className="text-[13px] text-gray-500">
              ตรวจสอบและอนุมัติหลักฐานการโอนเงินที่นักศึกษาแนบเข้ามาในระบบ
            </p>
          </div>

          {/* ส่ง Role เข้าไป */}
          <SharedVerifySlipList userRole="admin" />
        </main>
      </div>
    </div>
  );
}
