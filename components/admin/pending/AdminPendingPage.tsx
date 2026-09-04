"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
// เปลี่ยนไปดึง Shared Component แทนของเดิม
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";

export default function AdminPendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="เจ้าหน้าที่ สมศรี"
          userId="S2001"
        />

        <main className="p-4 sm:p-6 lg:p-8">
          {/* เพิ่ม Header แจ้งให้ทราบว่าอยู่ในหน้านี้ทำอะไร */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">คำร้องรอตรวจสอบ (Admin)</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ตรวจสอบเอกสารและพิจารณาความถูกต้องของคำร้อง
            </p>
          </div>

          {/* ส่ง userRole="admin" เพื่อให้ List ทำงานแบบแอดมินปกติ (แก้เลขวงเงินได้เหมือนกัน) */}
          <SharedRequestsList userRole="admin" />
        </main>
      </div>
    </div>
  );
}
