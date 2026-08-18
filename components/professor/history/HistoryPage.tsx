'use client';

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import UserProfile from "@/components/UserProfile";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

// Import Components ย่อยที่เพิ่งสร้าง
import HistoryFilterBar from "./HistoryFilterBar";
import HistoryTabs from "./HistoryTabs";
import HistoryCard from "./HistoryCard"

// Mock Data 
const mockHistory = [
  {
    requestId: 'SL-2026-000088',
    studentName: 'กมลชนก มีโชค',
    studentId: '651210001',
    timeline: [
      { status: 'ส่งคำร้องกู้ยืม', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'กมลชนก มีโชค', isDone: true },
      { status: 'อาจารย์ที่ปรึกษาอนุมัติ', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'พิมมา มีโชค', isDone: true },
      { status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'วรัญญู มีโชค', isDone: true },
      { status: 'ผู้บริหารพิจารณาอนุมัติ', timestamp: '', actor: '', isDone: false }
    ]
  },
  {
    requestId: 'SL-2026-000089',
    studentName: 'ปิยะพงษ์ สุขใจ',
    studentId: '651210042',
    timeline: [
      { status: 'ส่งคำร้องกู้ยืม', timestamp: '19 ธ.ค. 2569 09:30 น.', actor: 'ปิยะพงษ์ สุขใจ', isDone: true },
      { status: 'อาจารย์ที่ปรึกษาอนุมัติ', timestamp: '', actor: '', isDone: false },
      { status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', timestamp: '', actor: '', isDone: false },
      { status: 'ผู้บริหารพิจารณาอนุมัติ', timestamp: '', actor: '', isDone: false }
    ]
  }
];

const filterTabs = ['ทั้งหมด', 'อนุมัติ', 'ส่งกลับให้แก้ไข', 'อาจารย์ผิดคน', 'ปฏิเสธ', 'การเปิดดู'];

export default function HistoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const router = useRouter(); 

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
            <div>
              <h2 className="font-bold text-[#ea580c] text-sm sm:text-base">อาจารย์ที่ปรึกษา</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">มหาวิทยาลัยเชียงใหม่</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <UserProfile name="ผศ.ดร. สุนีย์ วงค์ประเสริฐ" id="T1002" initials="ผศ" />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
          
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">ประวัติการดำเนินการ</h1>
            <p className="text-[13px] text-gray-500">บันทึกทุกการดำเนินการที่ท่านได้กระทำในระบบ</p>
          </div>

          {/* เรียกใช้ Component ย่อย */}
          <HistoryFilterBar />
          
          <HistoryTabs 
            tabs={filterTabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mockHistory.map((historyItem, index) => (
              <HistoryCard 
                key={index} 
                historyItem={historyItem} 
                onClick={() => router.push('/professor/history/details')} 
              />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}