'use client';

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface StudentFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // เพิ่มการระบุว่าอาจจะไม่มีค่า (Optional) ก็ได้ เพื่อความปลอดภัย
  filterTabs?: string[]; 
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  activeTab,
  setActiveTab,
  filterTabs = [], // กำหนดค่าเริ่มต้นเป็น Array ว่าง ป้องกัน error 'map' of undefined
}) => {
  return (
    <>
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
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </>
  );
};

export default StudentFilters;