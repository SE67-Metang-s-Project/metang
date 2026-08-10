'use client';

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import UserProfile from "@/components/UserProfile";
import { 
  Menu, 
  Search, 
  ChevronDown, 
  Check 
} from "lucide-react";

// Mock Data ประวัติคำร้องแบบ Timeline
const mockHistory = [
  {
    requestId: 'SL-2026-000088',
    studentName: 'กมลชนก มีโชค',
    studentId: '651210001',
    timeline: [
      { 
        status: 'ส่งคำร้องกู้ยืม', 
        timestamp: '18 ธ.ค. 2569 10:00 น.', 
        actor: 'กมลชนก มีโชค', 
        isDone: true 
      },
      { 
        status: 'อาจารย์ที่ปรึกษาอนุมัติ', 
        timestamp: '18 ธ.ค. 2569 10:00 น.', 
        actor: 'พิมมา มีโชค', 
        isDone: true 
      },
      { 
        status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', 
        timestamp: '18 ธ.ค. 2569 10:00 น.', 
        actor: 'วรัญญู มีโชค', 
        isDone: true 
      },
      { 
        status: 'ผู้บริหารพิจารณาอนุมัติ', 
        timestamp: '', 
        actor: '', 
        isDone: false 
      }
    ]
  },
  {
    requestId: 'SL-2026-000089',
    studentName: 'ปิยะพงษ์ สุขใจ',
    studentId: '651210042',
    timeline: [
      { 
        status: 'ส่งคำร้องกู้ยืม', 
        timestamp: '19 ธ.ค. 2569 09:30 น.', 
        actor: 'ปิยะพงษ์ สุขใจ', 
        isDone: true 
      },
      { 
        status: 'อาจารย์ที่ปรึกษาอนุมัติ', 
        timestamp: '', 
        actor: '', 
        isDone: false 
      },
      { 
        status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', 
        timestamp: '', 
        actor: '', 
        isDone: false 
      },
      { 
        status: 'ผู้บริหารพิจารณาอนุมัติ', 
        timestamp: '', 
        actor: '', 
        isDone: false 
      }
    ]
  }
];

const filterTabs = [
  'ทั้งหมด', 
  'อนุมัติ', 
  'ส่งกลับให้แก้ไข', 
  'อาจารย์ผิดคน', 
  'ปฏิเสธ', 
  'การเปิดดู'
];

export default function HistoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      
      {/* SideNav */}
      <SideNav 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        role="professor" 
      />

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
            <UserProfile 
              name="ผศ.ดร. สุนีย์ วงค์ประเสริฐ" 
              id="T1002" 
              initials="ผศ" 
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">ประวัติการดำเนินการ</h1>
            <p className="text-[13px] text-gray-500">บันทึกทุกการดำเนินการที่ท่านได้กระทำในระบบ</p>
          </div>

          {/* Search Bar & Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative w-full flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-[8px] bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ea580c] text-[13px] transition-all" 
                placeholder="ค้นหาชื่อ / รหัสนักศึกษา / เลขคำร้อง" 
              />
            </div>
            
            <button className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-gray-700 hover:bg-gray-50 shrink-0 w-full sm:w-[160px]">
              <span>ทุกช่วงเวลา</span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="bg-[#eff2f5] p-2 rounded-[14px] flex items-center gap-2 overflow-x-auto mb-6 scrollbar-hide border border-gray-200/50">
            {filterTabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`focus:outline-none px-5 py-2.5 rounded-[10px] text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* History Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mockHistory.map((historyItem, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Header (Student Info) */}
                <div className="mb-5 pb-4 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2 mb-1">
                      คำร้อง <span className="bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-md text-[13px] border border-gray-200">{historyItem.requestId}</span>
                    </h3>
                    <p className="text-[13px] text-gray-500">
                      {historyItem.studentName} • {historyItem.studentId}
                    </p>
                  </div>
                </div>

                {/* Timeline Section */}
                <h4 className="text-[17px] font-extrabold text-gray-900 mb-5">ไทม์ไลน์สถานะคำร้อง</h4>
                
                <div className="relative">
                  {/* เส้นแกนกลาง (Vertical Line) */}
                  <div className="absolute top-3 left-[11px] bottom-5 w-[2px] bg-[#fbcaab]"></div>

                  <div className="space-y-6">
                    {historyItem.timeline.map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4">
                        
                        {/* จุดวงกลมสถานะ (Timeline Node) */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {step.isDone ? (
                            <div className="w-6 h-6 rounded-full bg-[#f89558] flex items-center justify-center shadow-sm">
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white border-[4px] border-[#fbc093] flex items-center justify-center"></div>
                          )}
                        </div>

                        {/* ข้อความและเวลา */}
                        <div className="flex-1">
                          <h4 className="font-bold text-[14.5px] text-gray-900 mb-1 leading-tight">{step.status}</h4>
                          {step.timestamp && (
                            <p className="text-[13px] text-gray-500 leading-tight">
                              {step.timestamp} · โดย {step.actor}
                            </p>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}