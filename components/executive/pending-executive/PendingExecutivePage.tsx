"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import RequestsListExecutive from "./RequestsList";

export default function PendingExecutivePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="executive" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              คำร้องรอพิจารณา (ในฐานะผู้บริหาร)
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              รายการคำขอขอกู้ยืมที่ผ่านการตรวจสอบจากอาจารย์ที่ปรึกษาและเจ้าหน้าที่แล้ว รอการอนุมัติขั้นสุดท้าย
            </p>
          </div>
          
          <RequestsListExecutive />
        </main>
      </div>
    </div>
  );
}