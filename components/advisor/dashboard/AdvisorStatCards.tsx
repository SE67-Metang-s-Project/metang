import React from 'react';
import { CalendarCheck, Clock, CheckSquare, X } from 'lucide-react';

export default function ProfessorStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* 1. ทั้งหมด (ฟ้า) */}
      <div className="bg-[#e0efff] border border-[#bae6fd] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
        <div className="relative z-10">
          <p className="text-[12px] font-extrabold text-[#0369a1] mb-1 leading-tight"><br />ทั้งหมด</p>
          <h3 className="text-[34px] font-extrabold text-[#0369a1] leading-none">6</h3>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
          <CalendarCheck className="w-7 h-7 text-[#0284c7]" strokeWidth={2.5} />
        </div>
        <CalendarCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-[#bae6fd] opacity-80" strokeWidth={2.5} />
      </div>

      {/* 2. รอพิจารณา (เหลือง) */}
      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
        <div className="relative z-10">
          <p className="text-[12px] font-extrabold text-[#b45309] mb-1 leading-tight"><br />รอพิจารณา</p>
          <h3 className="text-[34px] font-extrabold text-[#b45309] leading-none">5</h3>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
          <Clock className="w-7 h-7 text-[#d97706]" strokeWidth={2.5} />
        </div>
        <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-[#fde68a] opacity-80" strokeWidth={2.5} />
      </div>

      {/* 3. อนุมัติ (เขียว) */}
      <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
        <div className="relative z-10">
          <p className="text-[12px] font-extrabold text-[#166534] mb-1 leading-tight"><br />อนุมัติ</p>
          <h3 className="text-[34px] font-extrabold text-[#166534] leading-none">1</h3>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
          <CheckSquare className="w-7 h-7 text-[#16a34a]" strokeWidth={2.5} />
        </div>
        <CheckSquare className="absolute -right-4 -bottom-4 w-24 h-24 text-[#bbf7d0] opacity-80" strokeWidth={2.5} />
      </div>

      {/* 4. ปฏิเสธ (แดง) */}
      <div className="bg-[#fee2e2] border border-[#fecaca] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
        <div className="relative z-10">
          <p className="text-[12px] font-extrabold text-[#b91c1c] mb-1 leading-tight"><br />ปฏิเสธ</p>
          <h3 className="text-[34px] font-extrabold text-[#b91c1c] leading-none">0</h3>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
          <X className="w-7 h-7 text-[#dc2626]" strokeWidth={3} />
        </div>
        <X className="absolute -right-4 -bottom-4 w-24 h-24 text-[#fecaca] opacity-80" strokeWidth={3} />
      </div>
    </div>
  );
}