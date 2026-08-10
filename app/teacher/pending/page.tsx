'use client';

import React, { useState } from 'react';
import SideNav from '@/components/SidebarNav';
import UserProfile from '@/components/UserProfile';
import { Menu, Search, FileText } from 'lucide-react'; // นำ ArrowRight ออก และเพิ่ม FileText

// สร้าง Mock Data ให้ตรงกับข้อมูลในรูปภาพ
const actionRequests = [
  {
    id: 'SL-2026-000104',
    name: 'ธีรภัทร วัฒนา',
    studentId: '651210103',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '3',
    objective: 'ค่าเทอมและค่าใช้จ่ายในการฝึกงานภาคสนาม',
    amount: '3,000',
    term: '3',
    submitDate: '1 ส.ค. 2569',
    waitDays: 8,
    isOverdue: true,
  },
  {
    id: 'SL-2026-000102',
    name: 'ปิยะพงษ์ สุขใจ',
    studentId: '651210042',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '2',
    objective: 'ค่าใช้จ่ายส่วนตัว',
    amount: '2,500',
    term: '2',
    submitDate: '5 ส.ค. 2569',
    waitDays: 5,
    isOverdue: false,
  }
];

// รายการ Tabs กรองข้อมูล
const filterTabs = ['ทั้งหมด', 'รอพิจารณา', 'พิจารณาแล้ว', 'ส่งกลับให้แก้ไข', 'อนุมัติ', 'ปฏิเสธ'];

export default function PendingRequestsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      
      {/* SideNav */}
      <SideNav 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        role="teacher"
        currentPath="/teacher/pending" 
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] w-full mx-auto">
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">คำร้องทั้งหมด</h1>
            <p className="text-sm text-gray-500">คำร้องกู้ยืมของนักศึกษาในความดูแลทั้งหมด</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" strokeWidth={2} />
            </div>
            <input 
              type="text" 
              className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-[8px] bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all" 
              placeholder="ค้นหาเลขคำร้อง / ชื่อ / รหัสนักศึกษา" 
            />
          </div>

          {/* Filter Tabs */}
          <div className="bg-[#eff2f5] p-1.5 rounded-[12px] flex items-center space-x-1 overflow-x-auto mb-6 scrollbar-hide border border-gray-200/50">
            {filterTabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Request Cards List (ดีไซน์ตามรูปภาพที่ต้องการ) */}
          <div className="space-y-3">
            {actionRequests.map((req, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-[12px] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
                  
                  {/* Icon Box (ซ้ายสุด) */}
                  <div className="w-12 h-12 rounded-[10px] bg-[#fff7ed] flex items-center justify-center text-[#ea580c] shrink-0 hidden sm:flex border border-[#ffedd5]">
                    <FileText size={22} />
                  </div>

                  {/* Info Column 1: Name & Subtitle */}
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-bold text-[#1e293b] text-[15px] mb-1">{req.name}</h4>
                    <p className="text-[13px] text-gray-500">
                      {req.studentId} • {req.major} • ปี {req.year}
                    </p>
                  </div>

                  {/* Info Column 2: Date & Wait time */}
                  <div className="w-full sm:w-[130px] shrink-0">
                    <p className="font-bold text-[#334155] text-[14px] mb-0.5">{req.submitDate}</p>
                    <p className="text-[13px] text-gray-500">รอพิจารณา {req.waitDays} วัน</p>
                  </div>

                  {/* Info Column 3: Objective (Grey Pill ตรงกลาง) */}
                  <div className="hidden md:flex flex-1 justify-start">
                    <div className="bg-[#f1f5f9] px-3.5 py-1.5 rounded-full inline-flex max-w-[280px] lg:max-w-[340px]">
                      <p className="text-[13px] text-[#475569] font-medium truncate">
                        <span className="font-bold mr-1">฿{req.amount}</span> 
                        ({req.term} งวด) - {req.objective}
                      </p>
                    </div>
                  </div>

                  {/* Status Column */}
                  <div className="w-full sm:w-[110px] shrink-0 flex items-center xl:justify-end">
                    {req.isOverdue ? (
                      <span className="text-[#dc2626] text-[13px] font-bold flex items-center gap-1.5 bg-[#fef2f2] px-3 py-1 rounded-full border border-[#fee2e2]">
                        <span className="w-2 h-2 rounded-full bg-[#dc2626]"></span>
                        เลยกำหนด
                      </span>
                    ) : (
                      <span className="text-[#ea580c] text-[13px] font-bold flex items-center gap-1.5 bg-[#fff7ed] px-3 py-1 rounded-full border border-[#ffedd5]">
                        <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
                        ปกติ
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button (ปุ่มสีอ่อน ขวาสุด) */}
                <div className="shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                  <button className="w-full xl:w-auto bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] px-4 py-2.5 rounded-[8px] text-[14px] font-bold transition-colors">
                    ตรวจสอบคำร้อง
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}