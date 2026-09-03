"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import VerifySlipCard from "@/components/admin/verify-slip/VerifySlipCard"; 

// Import Mock Data ของคุณ (ต้องมั่นใจว่าใน Mock มีการใส่ paymentHistory ไว้บางรายการเพื่อเทสต์ปุ่มนะครับ)
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests"; 

export default function VerifySlipPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ดึงข้อมูล Mock Data มาเก็บไว้ใน State
  const [requests] = useState(mockAdminRequests);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        role="admin" 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        
        {/* Top Navigation */}
        <TopNav 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          userName="แอดมิน สมปอง" 
          userId="T1002" 
        />

        <main className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              ตรวจสอบสลิปชำระเงิน
            </h1>
            <p className="text-[13px] text-gray-500">
              ตรวจสอบและอนุมัติหลักฐานการโอนเงินที่นักศึกษาแนบเข้ามาในระบบ
            </p>
          </div>

          {/* 
            เรียกใช้ VerifySlipCard (เวอร์ชัน monolithic ที่รวมตารางและ Modal ไว้ด้วยกัน)
            ใช้ 'as any' ชั่วคราวเผื่อ Type ใน mockAdminRequests มีฟิลด์ไม่ครบตามที่กำหนดไว้ใหม่ 
          */}
          <VerifySlipCard 
            requests={requests as any} 
            userRole="admin" 
          />
          
        </main>
      </div>
    </div>
  );
}