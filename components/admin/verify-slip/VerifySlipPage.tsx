"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import VerifySlipCard from "@/components/admin/verify-slip/VerifySlipCard"; // นำเข้า Card
import { mockPendingSlips } from "@/components/shared/mockPendingSlips"; // นำเข้า Mock Data

export default function VerifySlipPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // จัดการ State ของข้อมูลที่หน้านี้แทน List
  const [transactions, setTransactions] = useState(mockPendingSlips);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        {/* เนื้อหาหลักของหน้า */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          {/* Header ของหน้า */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              ตรวจสอบสลิปชำระเงิน
            </h1>
            <p className="text-[13px] text-gray-500">
              ตรวจสอบความถูกต้องของสลิปที่นักศึกษาแนบมาในระบบ
            </p>
          </div>

          {/* เรียกใช้งาน Card และส่ง Data เข้าไป */}
          <VerifySlipCard transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
