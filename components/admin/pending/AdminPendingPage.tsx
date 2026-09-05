"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";

export default function PendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav onOpenSidebar={() => setIsSidebarOpen(true)} userName="แอดมินนี่" userId="T1002" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">คำร้องรอพิจารณา (Admin)</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ตรวจสอบคำร้องขอกู้ยืมของนักศึกษาที่รอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
            </p>
          </div>

          {/* 2. เรียกใช้งาน Shared Component พร้อมระบุ Role */}
          <SharedRequestsList userRole="admin" />
        </main>
      </div>
    </div>
  );
}
