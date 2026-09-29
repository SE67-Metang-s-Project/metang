"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getVisiblePages } from "@/lib/pagination";
export { getVisiblePages };

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="การแบ่งหน้าตาราง"
      className={`flex items-center justify-center gap-1.5 pt-4 pb-2 ${className}`}
    >
      {/* ปุ่มก่อนหน้า < */}
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="หน้าก่อนหน้า"
        className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
      >
        <ChevronLeft size={16} strokeWidth={2.2} />
      </button>

      {/* ปุ่มเลขหน้า เช่น 1 2 3 */}
      {visiblePages.map((page) => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`ไปที่หน้า ${page}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex size-9 items-center justify-center rounded-lg text-[14px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
              isActive
                ? "bg-[#ea580c] text-white font-semibold shadow-sm border border-[#ea580c]"
                : "border border-gray-200 bg-white text-gray-700 font-normal hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* ปุ่มถัดไป > */}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="หน้าถัดไป"
        className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
      >
        <ChevronRight size={16} strokeWidth={2.2} />
      </button>
    </nav>
  );
}
