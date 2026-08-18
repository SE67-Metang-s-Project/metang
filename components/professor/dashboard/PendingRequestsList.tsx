'use client';

import React from 'react';
import { Search, ChevronDown, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock Data
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

// Sub-component สำหรับการ์ด
const RequestCard = ({ req, onClick }: { req: typeof actionRequests[0], onClick: () => void }) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-white border border-gray-100 rounded-[14px] p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-orange-200 transition-all"
  >
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 flex-1 min-w-0">
      <div className="w-11 h-11 rounded-[10px] bg-[#fff7ed] flex items-center justify-center text-[#ea580c] shrink-0 hidden sm:flex border border-[#ffedd5]">
        <FileText size={20} strokeWidth={1.5} />
      </div>

      <div className="w-full sm:w-[260px] shrink-0">
        <h4 className="font-bold text-[#1e293b] text-[15px] mb-0.5">{req.name}</h4>
        <p className="text-[12.5px] text-gray-500 truncate">
          {req.studentId} • {req.major} • ปี {req.year}
        </p>
      </div>

      <div className="w-full sm:w-[120px] shrink-0">
        <p className="font-bold text-[#334155] text-[13.5px] mb-0.5">{req.submitDate}</p>
        <p className="text-[12.5px] text-gray-500">รอพิจารณา {req.waitDays} วัน</p>
      </div>

      <div className="hidden md:flex flex-1 items-center gap-2.5 min-w-0">
        <span className="bg-[#f1f5f9] px-3 py-1.5 rounded-[6px] text-[12.5px] font-bold text-[#334155] whitespace-nowrap">
          ฿{req.amount}
        </span>
        <span className="bg-[#f1f5f9] px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium text-[#475569] whitespace-nowrap">
          {req.term} งวด
        </span>
        <span className="text-[12.5px] text-gray-500 truncate">
          {req.objective}
        </span>
      </div>
    </div>

    <div className="shrink-0 w-full lg:w-auto mt-3 lg:mt-0">
      <button className="flex items-center justify-center gap-2 focus:outline-none w-full lg:w-auto bg-[#ea580c] hover:bg-[#d94a08] text-white px-5 py-2.5 rounded-[8px] text-[13.5px] font-bold transition-colors">
        ตรวจสอบคำร้อง
        <ArrowRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  </div>
);

export default function PendingRequestList() {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">คำร้องรอพิจารณา</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
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

          <button className="w-full sm:w-auto flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-[#ea580c] hover:bg-orange-50 shrink-0 transition-colors">
            <span>สถานะทั้งหมด</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

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
  );
}