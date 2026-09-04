"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface StudentFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filterTabs?: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  degreeFilter: string;
  setDegreeFilter: (degree: string) => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  activeTab,
  setActiveTab,
  filterTabs = [],
  searchQuery,
  setSearchQuery,
  degreeFilter,
  setDegreeFilter,
}) => {
  // State สำหรับควบคุมการเปิด/ปิด Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // รายการตัวเลือกระดับการศึกษา
  const degreeOptions = [
    { value: "ประกาศนียบัตรผู้ช่วยพยาบาล", label: "ประกาศนียบัตรผู้ช่วยพยาบาล" },
    { value: "ป.ตรี", label: "ป.ตรี" },
    { value: "ป.โท", label: "ป.โท" },
    { value: "ป.เอก", label: "ป.เอก" },
  ];

  // ฟังก์ชันจัดการเมื่อคลิกเลือก
  const handleDegreeSelect = (value: string) => {
    if (degreeFilter === value) {
      // ถ้าคลิกตัวที่กำลังเลือกอยู่ ให้ยกเลิก (กลับเป็น "ทั้งหมด")
      setDegreeFilter("ทั้งหมด");
    } else {
      // ถ้าเลือกตัวใหม่ ก็เปลี่ยนเป็นค่านั้น
      setDegreeFilter(value);
    }
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* Search Bar & Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* ช่องค้นหา */}
        <div className="relative w-full flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-[8px] bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ea580c] text-[13px] transition-all"
            placeholder="ค้นหารหัสคำร้อง ชื่อ วันที่..."
          />
        </div>

        {/* Custom Dropdown ระดับการศึกษา */}
        <div className="relative w-full sm:w-[220px] shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              flex items-center justify-between w-full px-4 py-2.5 border rounded-[8px] text-[13px] transition-all focus:outline-none focus:ring-1 focus:ring-[#ea580c]
              ${
                degreeFilter !== "ทั้งหมด"
                  ? "bg-[#fff7ed] border-[#ffedd5] text-[#ea580c] font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
              }
            `}
          >
            <span className="truncate">
              {degreeFilter === "ทั้งหมด" ? "ทุกระดับการศึกษา" : degreeFilter}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* รายการใน Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* ปุ่มกลับไปค่าเริ่มต้น */}
              <button
                onClick={() => handleDegreeSelect("ทั้งหมด")}
                className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-orange-50 ${
                  degreeFilter === "ทั้งหมด"
                    ? "text-[#ea580c] bg-orange-50/50 font-medium"
                    : "text-gray-700"
                }`}
              >
                ทุกระดับการศึกษา
              </button>

              {/* วนลูปสร้างตัวเลือกอื่นๆ */}
              {degreeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDegreeSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-orange-50 ${
                    degreeFilter === option.value
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
