"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
// 1. นำเข้า Shared Component
import SharedDisburseDebtList from "@/components/shared/disburse-debt/SharedDisburseDebtList";

export default function DisburseDebtPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมิน สมปอง"
          userId="T1002"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              เบิกจ่ายเงินให้นักศึกษา (Disbursement)
            </h1>
            <p className="text-[13px] text-gray-500">
              รายการคำร้องที่ผ่านการอนุมัติจากผู้บริหารแล้ว
              กรุณาโอนเงินและแนบสลิปเพื่อยืนยันการเบิกจ่าย
            </p>
          </div>

          {/* 2. เรียกใช้งาน Shared Component พร้อมระบุ Role */}
          <SharedDisburseDebtList userRole="admin" />
        </main>
      </div>
    </div>
  );
}
