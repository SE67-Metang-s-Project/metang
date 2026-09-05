"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import PendingRequestsList from "./AdminRequestsList";

export default function PendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        {/* เอา div ที่เคยครอบตรงนี้ออก แล้ววาง TopNav เลย */}
        <TopNav onOpenSidebar={() => setIsSidebarOpen(true)} userName="แอดมินนี่" userId="T1002" />

        {/* แนะนำให้เพิ่มจัดกึ่งกลางและ padding ให้เหมือนหน้าอื่น */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">คำร้องรอพิจารณา (Admin)</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ตรวจสอบคำร้องขอกู้ยืมของนักศึกษาที่รอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
            </p>
          </div>
          <PendingRequestsList />
        </main>
      </div>
    </div>
  );
}
