'use client';

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import UserProfile from "@/components/UserProfile";
import { Menu } from "lucide-react";

// 1. Import กล่องต่างๆ ของเราเข้ามา
import ProfessorWelcomeCard from "./ProfessorWelcomeCard";
import ProfessorStatCards from "./ProfessorStatCards";
import PendingRequestsList from "./PendingRequestsList";
import ProfessorRecentHistory from "./ProfessorRecentHistory";

export default function ProfessorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="professor" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        
        {/* Top Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 lg:px-10 shrink-0 sticky top-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-bold text-[#ea580c] text-sm sm:text-base">อาจารย์ที่ปรึกษา</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">มหาวิทยาลัยเชียงใหม่</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <UserProfile name="ผศ.ดร. สุนีย์ วงค์ประเสริฐ" id="T1002" initials="ผศ" />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          
          {/* ส่วนบนสุด: Welcome Card และสถิติ */}
          <div>
            <ProfessorWelcomeCard />
            <ProfessorStatCards />
          </div>

          {/* ส่วนเนื้อหาหลัก: เรียงต่อกันลงมาเป็นแนวดิ่ง */}
          
          {/* 1. รายการคำร้องที่ต้องพิจารณา */}
          <div className="w-full">
            <PendingRequestsList />
          </div>

          {/* 2. ประวัติการดำเนินการล่าสุด (ต่อลงมาเลย) */}
          <div className="w-full">
            <ProfessorRecentHistory />
          </div>

        </div>
      </main>
    </div>
  );
}