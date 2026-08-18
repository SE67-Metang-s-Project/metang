// ช่องค้นหา และ Dropdown ช่วงเวลา

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function HistoryFilterBar() {
  return (
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
  );
}