"use client";

import React from "react";
import { Search } from "lucide-react"; // อย่าลืม import Search icon

// กำหนด Type สำหรับสถานะตัวกรอง
export type FilterStatus = "all" | "pending" | "approved" | "rejected";

interface PendingFilterProps {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  pendingCount?: number;
  // เพิ่ม Props สำหรับช่องค้นหา
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function PendingFilter({
  currentFilter,
  onFilterChange,
  pendingCount = 0,
  searchQuery = "",
  onSearchChange,
}: PendingFilterProps) {
  
  // รายการสถานะที่สามารถกรองได้
  const filterOptions: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "ทั้งหมด" },
    { id: "pending", label: "รอพิจารณา" },
    { id: "approved", label: "อนุมัติแล้ว" },
    { id: "rejected", label: "ไม่อนุมัติ" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      
      {/* 1. ปุ่มตัวกรองสถานะ */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
        {filterOptions.map((option) => {
          const isActive = currentFilter === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`
                relative flex items-center justify-center px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-[#fff7ed] text-[#ea580c] shadow-sm border border-[#ffedd5]"
                    : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
                }
              `}
            >
              {option.label}
              
              {/* แสดง Badge ตัวเลขเฉพาะแท็บ "รอพิจารณา" */}
              {option.id === "pending" && pendingCount > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full 
                    ${
                      isActive
                        ? "bg-[#ea580c] text-white"
                        : "bg-[#fee2e2] text-[#dc2626]"
                    }
                  `}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. ช่องค้นหา */}
      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
          className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-colors"
        />
      </div>

    </div>
  );
}