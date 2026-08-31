"use client";

import React from "react";

// ==========================================
// การกำหนด Type
// ==========================================
export interface Student {
  initial: string;
  name: string;
  studentId: string;
  major: string;
  year: string;
  requestStatus: string;
  paymentStatus: string;
  paymentStatusType: "good" | "bad" | "neutral";
  totalBorrowed: string;
  balance: string;
  delayDays: string;
}

interface StudentListTableProps {
  students: Student[];
}

export default function StudentListTable({ students }: StudentListTableProps) {
  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* 1. มุมมองสำหรับ Mobile (แสดงเป็นการ์ดแบบเดิม) */}
      {/* ========================================== */}
      <div className="md:hidden space-y-4">
        {students.map((student, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon Box (Avatar) */}
              <div className="w-12 h-12 rounded-[10px] bg-[#fff7ed] flex items-center justify-center font-bold text-[#ea580c] text-[18px] shrink-0 border border-[#ffedd5]">
                {student.initial}
              </div>

              {/* ข้อมูลหลัก */}
              <div className="flex-1">
                <h4 className="font-bold text-[#1e293b] text-[15px] mb-0.5">{student.name}</h4>
                <p className="text-[12px] text-gray-400 font-medium">
                  {student.studentId} • {student.major} • ปี {student.year}
                </p>
              </div>
            </div>

            {/* ข้อมูลสถานะและยอดเงิน */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-3">
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">ยอดกู้ยืม</div>
                <div className="font-semibold text-gray-700 text-[13px]">฿{student.totalBorrowed}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">คงเหลือ</div>
                <div className="font-semibold text-[#dc2626] text-[13px]">฿{student.balance}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">สถานะการชำระ</div>
                <div className="text-[12px] text-gray-400 font-medium">
                  ล่าช้า {student.delayDays} วัน
                </div>
              </div>
            </div>

            {/* Pill Status */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                {student.requestStatus}
              </span>

              {student.paymentStatusType === "good" ? (
                <span className="bg-[#dcfce7] text-[#16a34a] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#bbf7d0] w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                  {student.paymentStatus}
                </span>
              ) : student.paymentStatusType === "bad" ? (
                <span className="bg-[#fee2e2] text-[#dc2626] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#fecaca] w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                  {student.paymentStatus}
                </span>
              ) : (
                <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#e2e8f0] w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                  {student.paymentStatus}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
      {/* ========================================== */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1000px] bg-white">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[250px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                สถานะคำร้อง
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                พฤติกรรมการชำระเงิน
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                การกู้ยืมทั้งหมด
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                ยอดหนี้คงเหลือ
              </th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">
                ล่าช้า (วัน)
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
              >
                {/* 1. ข้อมูลนักศึกษา */}
                <td className="py-3 px-4 border-r border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] flex items-center justify-center font-bold text-[#ea580c] text-[16px] shrink-0 border border-[#ffedd5]">
                      {student.initial}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{student.name}</div>
                      <div className="text-[13px] text-gray-500 mt-0.5">
                        {student.studentId} • {student.major} • ปี {student.year}
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. สถานะคำร้อง */}
                <td className="py-3 px-4 border-r border-gray-200 whitespace-nowrap">
                  <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                    {student.requestStatus}
                  </span>
                </td>

                {/* 3. สถานะการชำระเงิน */}
                <td className="py-3 px-4 border-r border-gray-200 whitespace-nowrap">
                  {student.paymentStatusType === "good" ? (
                    <span className="bg-[#dcfce7] text-[#16a34a] px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border border-[#bbf7d0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                      {student.paymentStatus}
                    </span>
                  ) : student.paymentStatusType === "bad" ? (
                    <span className="bg-[#fee2e2] text-[#dc2626] px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border border-[#fecaca]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                      {student.paymentStatus}
                    </span>
                  ) : (
                    <span className="bg-[#f1f5f9] text-[#64748b] px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border border-[#e2e8f0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                      {student.paymentStatus}
                    </span>
                  )}
                </td>

                {/* 4. การกู้ยืมทั้งหมด */}
                <td className="py-3 px-4 text-gray-700 font-medium border-r border-gray-200 whitespace-nowrap">
                  ฿{student.totalBorrowed}
                </td>

                {/* 5. ยอดหนี้คงเหลือ */}
                <td className="py-3 px-4 text-[#dc2626] font-bold border-r border-gray-200 whitespace-nowrap">
                  ฿{student.balance}
                </td>

                {/* 6. ล่าช้า (วัน) */}
                <td className="py-3 px-4 text-gray-600 whitespace-nowrap text-center font-medium">
                  {student.delayDays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}