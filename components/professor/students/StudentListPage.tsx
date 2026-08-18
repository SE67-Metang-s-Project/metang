'use client';

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import UserProfile from "@/components/UserProfile";
import { Menu, Search, ChevronDown } from "lucide-react";

// Mock Data รายชื่อนักศึกษา
const mockStudents = [
  {
    initial: 'ก',
    name: 'กมลชนก ใจดี',
    studentId: '651210001',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '3',
    requestStatus: 'รออาจารย์ที่ปรึกษาอนุมัติ',
    paymentStatus: 'จ่ายตรงเวลาเสมอ',
    paymentStatusType: 'good', // เขียว
    balance: '17,501',
    delayDays: '0'
  },
  {
    initial: 'ป',
    name: 'ปิยะพงษ์ สุขใจ',
    studentId: '651210042',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '2',
    requestStatus: 'รออาจารย์ที่ปรึกษาอนุมัติ',
    paymentStatus: 'มีหนี้เกินกำหนด',
    paymentStatusType: 'bad', // แดง
    balance: '16,500',
    delayDays: '0'
  },
  {
    initial: 'อ',
    name: 'อริสรา แสงจันทร์',
    studentId: '651210077',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '4',
    requestStatus: 'รออาจารย์ที่ปรึกษาอนุมัติ',
    paymentStatus: 'มีหนี้เกินกำหนด',
    paymentStatusType: 'bad', // แดง
    balance: '18,501',
    delayDays: '9'
  },
  {
    initial: 'ธ',
    name: 'ธีรภัทร วัฒนา',
    studentId: '651210103',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '3',
    requestStatus: 'รออาจารย์ที่ปรึกษาอนุมัติ',
    paymentStatus: 'ยังไม่มีประวัติชำระ',
    paymentStatusType: 'neutral', // เทา
    balance: '12,000',
    delayDays: '0'
  },
  {
    initial: 'ณ',
    name: 'ณิชา ประเสริฐ',
    studentId: '651210158',
    major: 'พยาบาลศาสตรบัณฑิต',
    year: '2',
    requestStatus: 'รออาจารย์ที่ปรึกษาอนุมัติ',
    paymentStatus: 'ยังไม่มีประวัติชำระ',
    paymentStatusType: 'neutral', // เทา
    balance: '9,999',
    delayDays: '0'
  }
];

const filterTabs = [
  'ทั้งหมด', 
  'มีคำร้องดำเนินการ', 
  'ไม่มีคำร้อง', 
  'มีหนี้คงเหลือ', 
  'ชำระครบ', 
  'เคยชำระล่าช้า'
];

export default function StudentList() {
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">นักศึกษาในความดูแล</h1>
            <p className="text-[13px] text-gray-500">รายชื่อนักศึกษาที่อยู่ภายใต้การดูแลของท่าน</p>
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
                placeholder="ค้นหาชื่อ / รหัสนักศึกษา" 
              />
            </div>
            
            <button className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-gray-700 hover:bg-gray-50 shrink-0 w-full sm:w-[140px]">
              <span>ทุกชั้นปี</span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
            </button>
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

          {/* Student List (แนวยาว) */}
          <div className="space-y-3">
            {mockStudents.map((student, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-[12px] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
                  
                  {/* Icon Box (Avatar) */}
                  <div className="w-12 h-12 rounded-[10px] bg-[#fff7ed] flex items-center justify-center font-bold text-[#ea580c] text-[18px] shrink-0 hidden sm:flex border border-[#ffedd5]">
                    {student.initial}
                  </div>

                  {/* Info Column 1: Name & Major */}
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-bold text-[#1e293b] text-[15px] mb-0.5">{student.name}</h4>
                    <p className="text-[12px] text-gray-400 font-medium">
                      {student.studentId} • {student.major} • ปี {student.year}
                    </p>
                  </div>

                  {/* Info Column 2: Balance & Delay */}
                  <div className="w-full sm:w-[130px] shrink-0">
                    <p className="font-semibold text-gray-700 text-[13px]">฿{student.balance}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5 font-medium">ล่าช้า {student.delayDays} วัน</p>
                  </div>

                  {/* Info Column 3: Request Status (Grey Pill) */}
                  <div className="hidden md:flex w-[200px] shrink-0">
                    <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                      {student.requestStatus}
                    </span>
                  </div>

                  {/* Status Column: Payment Status (Colored Pill) */}
                  <div className="w-full sm:w-[140px] shrink-0 flex items-center">
                    {student.paymentStatusType === 'good' ? (
                      <span className="bg-[#dcfce7] text-[#16a34a] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#bbf7d0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                        {student.paymentStatus}
                      </span>
                    ) : student.paymentStatusType === 'bad' ? (
                      <span className="bg-[#fee2e2] text-[#dc2626] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#fecaca]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                        {student.paymentStatus}
                      </span>
                    ) : (
                      <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#e2e8f0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                        {student.paymentStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                  <button className="w-full xl:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-[#1e293b] px-5 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors shadow-sm">
                    ดูโปรไฟล์
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