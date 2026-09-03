"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

// กำหนด Type สำหรับสถานะตัวกรองของ UI
export type FilterStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "pending_admin"
  | "cancelled"
  | "pending_executive";

interface PendingFilterProps {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  pendingCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  pendingLabel?: string; // เพิ่ม Prop นี้เพื่อให้แต่ละ Role ตั้งชื่อแท็บได้เอง
}

export default function PendingFilter({
  currentFilter,
  onFilterChange,
  pendingCount = 0,
  searchQuery = "",
  onSearchChange,
  pendingLabel = "รอพิจารณา", // ค่าเริ่มต้น
}: PendingFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownSelect = (status: FilterStatus) => {
    if (currentFilter === status) {
      onFilterChange("all");
    } else {
      onFilterChange(status);
    }
    setIsDropdownOpen(false);
  };

  const mainFilterOptions: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "ทั้งหมด" },
    { id: "pending", label: pendingLabel }, // ใช้ Label ตามที่ส่งเข้ามา
  ];

  const statusOptions: { id: Exclude<FilterStatus, "all" | "pending">; label: string }[] = [
    { id: "approved", label: "อนุมัติแล้ว" },
    { id: "rejected", label: "ไม่อนุมัติ" },
    { id: "pending_admin", label: "รอเจ้าหน้าที่ตรวจสอบ" },
    { id: "cancelled", label: "นักศึกษายกเลิกคำร้อง" },
    { id: "pending_executive", label: "รอผู้บริหารอนุมัติ" },
  ];
  const selectedStatus = statusOptions.find((option) => option.id === currentFilter);
  const isDropdownActive = selectedStatus !== undefined;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* 1. ปุ่มตัวกรองสถานะหลัก */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
        {mainFilterOptions.map((option) => {
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

              {option.id === "pending" && pendingCount > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full 
                    ${isActive ? "bg-[#ea580c] text-white" : "bg-[#fee2e2] text-[#dc2626]"}
                  `}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. ดรอปดาวน์ และ ช่องค้นหา */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto min-w-[220px]" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              flex items-center justify-between w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-colors
              ${
                isDropdownActive
                  ? "bg-[#fff7ed] text-[#ea580c] font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span>{selectedStatus?.label ?? "เลือกดูสถานะ"}</span>
            <ChevronDown
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleDropdownSelect(option.id)}
                  className={`w-full text-left px-4 py-2 text-[14px] transition-colors hover:bg-orange-50 ${
                    currentFilter === option.id
                      ? "text-[#ea580c] bg-orange-50/50 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
    </div>
  );
}
