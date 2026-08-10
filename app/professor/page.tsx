'use client';

import React, { useState } from 'react';
import SideNav from '@/components/SidebarNav';
import UserProfile from '@/components/UserProfile';
import { 
  Menu, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock,
  ChevronDown
} from 'lucide-react';

// Mock Data จากรูปที่ 2
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
    overdueText: 'เกินกำหนด 1 วัน'
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
    overdueText: ''
  }
];

export default function TeacherDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      
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
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <UserProfile 
              name="ผศ.ดร.สุภาวดี วงศ์งาม" 
              id="T1045" 
              initials="ผศ" 
            />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
          
          {/* Welcome Banner (ธีมสีส้ม-เทา) */}
          <div className="bg-gradient-to-r from-[#ea580c] to-[#f97316] rounded-[16px] p-6 sm:p-8 text-white mb-8 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">สวัสดี, ผศ.ดร.สุภาวดี วงศ์งาม</h1>
            <p className="text-sm opacity-90">คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่</p>
          </div>

          {/* Stat Cards (ดีไซน์ตามรูปที่ 1: การ์ดสีพาสเทลอ่อน, มีกรอบไอคอนด้านขวา) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            
            {/* 1. รอพิจารณา */}
            <div className="bg-[#fff7ed] rounded-[14px] p-4 relative overflow-hidden flex flex-col justify-between h-[104px] border border-[#ffedd5]">
              <p className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wider z-10">รอพิจารณา</p>
              <h3 className="text-3xl font-extrabold text-[#c2410c] z-10">5</h3>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/70 rounded-[10px] flex items-center justify-center z-10">
                <FileText className="w-5 h-5 text-[#ea580c]" />
              </div>
              <FileText className="absolute -right-3 -bottom-3 w-20 h-20 text-[#ea580c] opacity-[0.04]" />
            </div>

            {/* 2. ใกล้ครบกำหนด */}
            <div className="bg-[#fef2f2] rounded-[14px] p-4 relative overflow-hidden flex flex-col justify-between h-[104px] border border-[#fee2e2]">
              <p className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wider z-10">ใกล้ครบกำหนด</p>
              <h3 className="text-3xl font-extrabold text-[#b91c1c] z-10">4</h3>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/70 rounded-[10px] flex items-center justify-center z-10">
                <AlertCircle className="w-5 h-5 text-[#dc2626]" />
              </div>
              <AlertCircle className="absolute -right-3 -bottom-3 w-20 h-20 text-[#dc2626] opacity-[0.04]" />
            </div>

            {/* 3. อนุมัติแล้ว */}
            <div className="bg-[#f1f5f9] rounded-[14px] p-4 relative overflow-hidden flex flex-col justify-between h-[104px] border border-[#cbd5e1]">
              <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider z-10">อนุมัติแล้ว</p>
              <h3 className="text-3xl font-extrabold text-[#334155] z-10">15</h3>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 rounded-[10px] flex items-center justify-center z-10">
                <CheckCircle2 className="w-5 h-5 text-[#475569]" />
              </div>
              <CheckCircle2 className="absolute -right-3 -bottom-3 w-20 h-20 text-[#475569] opacity-[0.04]" />
            </div>

            {/* 4. ไม่อนุมัติ */}
            <div className="bg-[#e2e8f0] rounded-[14px] p-4 relative overflow-hidden flex flex-col justify-between h-[104px] border border-[#cbd5e1]">
              <p className="text-[11px] font-bold text-[#334155] uppercase tracking-wider z-10">ไม่อนุมัติ</p>
              <h3 className="text-3xl font-extrabold text-[#1e293b] z-10">1</h3>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 rounded-[10px] flex items-center justify-center z-10">
                <XCircle className="w-5 h-5 text-[#334155]" />
              </div>
              <XCircle className="absolute -right-3 -bottom-3 w-20 h-20 text-[#334155] opacity-[0.04]" />
            </div>

          </div>

          {/* List Section Header (โครงสร้างแบบรูปที่ 1) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 className="text-[#1e293b] text-2xl font-bold mb-1">คำร้องที่ต้องดำเนินการ</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-[240px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#ea580c]" 
                  placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..." 
                />
              </div>
              <button className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-gray-700 hover:bg-gray-50 shrink-0">
                <span>ทั้งหมด</span>
                <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List Items (แนวยาวแบบรูป 1 แต่ข้อมูลจากรูป 2) */}
          <div className="space-y-3">
            {actionRequests.map((req, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-[12px] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
                  
                  {/* Icon Box (ซ้ายสุด) */}
                  <div className="w-11 h-11 rounded-[10px] bg-[#fff7ed] flex items-center justify-center text-[#ea580c] shrink-0 hidden sm:flex border border-[#ffedd5]">
                    <FileText size={20} />
                  </div>

                  {/* Info Column 1: Name & Subtitle */}
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-bold text-[#1e293b] text-[15px] mb-0.5">{req.name}</h4>
                    <p className="text-[12px] text-gray-500">
                      {req.studentId} • {req.major} • ปี {req.year}
                    </p>
                  </div>

                  {/* Info Column 2: Date & Wait time */}
                  <div className="w-full sm:w-[130px] shrink-0">
                    <p className="font-semibold text-gray-700 text-[13px]">{req.submitDate}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">รอพิจารณา {req.waitDays} วัน</p>
                  </div>

                  {/* Info Column 3: Objective (Grey Pill ตรงกลาง) */}
                  <div className="hidden md:flex flex-1 justify-start">
                    <div className="bg-[#f1f5f9] px-3 py-1.5 rounded-full inline-flex max-w-[280px] lg:max-w-[320px]">
                      <p className="text-[12px] text-[#475569] font-medium truncate">
                        <span className="font-bold mr-1">฿{req.amount}</span> 
                        ({req.term} งวด) - {req.objective}
                      </p>
                    </div>
                  </div>

                  {/* Status Column */}
                  <div className="w-full sm:w-[100px] shrink-0 flex items-center xl:justify-end">
                    {req.isOverdue ? (
                      <span className="text-[#dc2626] text-[12px] font-bold flex items-center gap-1.5 bg-[#fef2f2] px-2.5 py-1 rounded-full border border-[#fee2e2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                        เลยกำหนด
                      </span>
                    ) : (
                      <span className="text-[#ea580c] text-[12px] font-bold flex items-center gap-1.5 bg-[#fff7ed] px-2.5 py-1 rounded-full border border-[#ffedd5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                        ปกติ
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button (ปุ่มสีอ่อน ขวาสุด) */}
                <div className="shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                  <button className="w-full xl:w-auto bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] px-4 py-2 rounded-[8px] text-[13px] font-bold transition-colors">
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