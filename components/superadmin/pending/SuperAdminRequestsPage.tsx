"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

// Import Component List ของ Super Admin ที่สร้างไว้
import SuperAdminRequestsList from "./SuperAdminRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type SuperAdminPendingPageProps = {
  userName?: string;
  userId?: string;
  initialRequests?: ActionRequest[];
};

export default function SuperAdminPendingPage({
  userName = "Super Admin สูงสุด",
  userId = "SA-001",
  initialRequests = [],
}: SuperAdminPendingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation - ส่ง role="superadmin" เพื่อให้แสดงเมนูครบ */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* เพิ่ม Header แจ้งให้ทราบว่าอยู่ในหน้าของใคร เพื่อกันความสับสน */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              คำร้องรอพิจารณา (Super Admin)
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              ตรวจสอบคำร้องขอกู้ยืม ในฐานะผู้ดูแลระบบคุณสามารถพิจารณาและปรับแก้วงเงินได้
            </p>
          </div>

          {/* เรียกใช้งาน List ของ Super Admin ที่จะเปิดฟังก์ชันแก้ตัวเลขได้ */}
          <SuperAdminRequestsList initialRequests={initialRequests} />
        </main>
      </div>
    </div>
  );
}
