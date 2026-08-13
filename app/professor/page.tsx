'use client';

import React, { useState } from 'react';
import SideNav from '@/components/SidebarNav';
import UserProfile from '@/components/UserProfile';
import { Menu, Search, FileText, ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ==========================================
// 1. Mock Data
// ==========================================
const actionRequests = [
  {
    id: "SL-2026-000104",
    name: "ธีรภัทร วัฒนา",
    studentId: "651210103",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    objective: "ค่าเทอมและค่าใช้จ่ายในการฝึกงานภาคสนาม",
    amount: "3,000",
    term: "3",
    submitDate: "1 ส.ค. 2569",
    waitDays: 8,
    isOverdue: true,
  },
  {
    id: "SL-2026-000102",
    name: "ปิยะพงษ์ สุขใจ",
    studentId: "651210042",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    objective: "ค่าใช้จ่ายส่วนตัว",
    amount: "2,500",
    term: "2",
    submitDate: "5 ส.ค. 2569",
    waitDays: 5,
    isOverdue: false,
  },
  
];

// ==========================================
// 2. Sub-Components
// ==========================================

const RequestCard = ({
  req,
  onClick,
}: {
  req: (typeof actionRequests)[0];
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer bg-white border border-gray-200 rounded-[12px] p-5 sm:p-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden ${
      req.isOverdue ? 'border-l-[4px] border-l-[#dc2626]' : 'border-l-[4px] border-l-transparent'
    }`}
  >
    {/* Top Row: ID, Date & Button */}
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="font-bold text-[#1e293b] bg-gray-100 px-2.5 py-1 rounded-[6px] text-[13px]">
          {req.id}
        </span>
        <span className="text-[13px] text-gray-500">ยื่นเมื่อ {req.submitDate}</span>
      </div>

      {/* เปลี่ยนสีปุ่มจากเขียวเป็นส้มตามโลโก้ */}
      <button className="hidden sm:flex focus:outline-none items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors">
        ตรวจสอบคำร้อง
        <ArrowRight size={16} />
      </button>
    </div>

    {/* Info Column: Name & Subtitle */}
    <div className="mb-4">
      <h4 className="font-bold text-[#1e293b] text-[18px] mb-1">{req.name}</h4>
      <p className="text-[13.5px] text-gray-500">
        {req.studentId} • {req.major} • ชั้นปีที่ {req.year}
      </p>
    </div>

    {/* Objective */}
    <div className="mb-5">
      <p className="text-[13px] text-gray-500 mb-0.5">วัตถุประสงค์:</p>
      <p className="text-[14px] text-[#1e293b]">{req.objective}</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
      <div>
        <p className="text-[13px] text-gray-500 mb-0.5">จำนวนที่ขอกู้</p>
        <p className="text-[16px] font-bold text-[#1e293b]">฿{req.amount}</p>
      </div>
      <div>
        <p className="text-[13px] text-gray-500 mb-0.5">งวดชำระ</p>
        <p className="text-[16px] font-bold text-[#1e293b]">{req.term} งวด</p>
      </div>
      <div className="flex items-start gap-2">
        <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] text-gray-500 mb-0.5">รอพิจารณา</p>
          <p className="text-[16px] font-bold text-[#1e293b]">{req.waitDays} วัน</p>
        </div>
      </div>
    </div>

    {/* Mobile Button & Overdue Badge */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-4">

      {/* เปลี่ยนสีปุ่มมือถือจากเขียวเป็นส้มตามโลโก้ */}
      <button className="sm:hidden w-full focus:outline-none flex justify-center items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors">
        ตรวจสอบคำร้อง
        <ArrowRight size={16} />
      </button>
    </div>
  </div>
);

// ==========================================
// 3. Main Page
// ==========================================
export default function PendingRequestsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <UserProfile name="ผศ.ดร. สุนีย์ วงค์ประเสริฐ" id="T1002" initials="ผศ" />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
          
          {/* Welcome Card ปรับสีให้ตรงโลโก้ */}
          <div className="bg-gradient-to-r from-[#ea580c] to-[#f97316] rounded-[16px] p-6 sm:p-8 text-white shadow-sm mb-8">
            <h2 className="text-2xl font-bold mb-2">สวัสดี, ผศ.ดร. สุนีย์ วงค์ประเสริฐ</h2>
            <p className="text-sm opacity-90">คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่</p>
          </div>

          {/* Section: Title + Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            
            {/* Page Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">คำร้องรอพิจารณา</h1>
            </div>

            {/* Search Bar & Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-[8px] bg-white text-[13px] focus:outline-none focus:ring-1 focus:ring-[#ea580c] transition-all"
                  placeholder="ค้นหาเลขคำร้อง / ชื่อ / รหัสนักศึกษา"
                />
              </div>

              {/* Dropdown Button */}
              <button className="w-full sm:w-auto flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-[#ea580c] hover:bg-orange-50 shrink-0 transition-colors">
                <span>สถานะทั้งหมด</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
            </div>
          </div>

          {/* Request Cards List */}
          <div className="space-y-3">
            {actionRequests.map((req, index) => (
              <RequestCard
                key={index}
                req={req}
                onClick={() => router.push("/professor/pending/details")}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}