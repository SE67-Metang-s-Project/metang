"use client";

import React from "react";
import { Receipt } from "lucide-react";
import { LoanTransaction, PaymentEvidence } from "@/components/shared/types/loan.types";

interface LoanListTableProps {
  transactions: LoanTransaction[];
  // ฟังก์ชันนี้จะถูกเรียกเมื่อผู้ใช้กดปุ่ม และส่งข้อมูลคำร้อง (loan) กลับไปให้หน้าแม่
  onSelectLoan: (loan: LoanTransaction) => void;
}

export default function LoanListTable({ transactions, onSelectLoan }: LoanListTableProps) {
  
  // ฟังก์ชันจัดฟอร์แมตตัวเลข
  const formatAmount = (amountStr: string) => {
    const num = Number(amountStr);
    return isNaN(num) ? amountStr : num.toLocaleString();
  };

  // ฟังก์ชันเช็คว่ามีสลิปที่รอตรวจสอบหรือไม่
  const hasPendingSlip = (history?: PaymentEvidence[]) => {
    if (!history) return false;
    return history.some((ev) => ev.status === "pending");
  };

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* 1. มุมมอง Mobile (การ์ดรายชื่อ) */}
      {/* ========================================== */}
      <div className="md:hidden space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold text-gray-900 text-[15px] leading-tight">{tx.studentName}</div>
                <div className="text-[13px] text-gray-500 mt-1">{tx.id} • {tx.studentId}</div>
              </div>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0 border border-gray-200">
                {/* ป้องกัน Error ด้วย ?. และ || "-" */}
                {tx.submitDate?.split(" ")[0] || "-"}
              </span>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">ยอดกู้ยืมรวม</div>
                <div className="font-bold text-gray-900">฿{formatAmount(tx.totalAmount)}</div>
              </div>
              <button
                onClick={() => onSelectLoan(tx)} // เรียกฟังก์ชันที่ส่งมาจาก Props
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${
                  hasPendingSlip(tx.paymentHistory)
                    ? "bg-orange-50 hover:bg-orange-100 text-[#ea580c] border-orange-200"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                }`}
              >
                {hasPendingSlip(tx.paymentHistory) ? (
                  <><Receipt size={14} /> ตรวจสอบสลิปใหม่</>
                ) : (
                  "ดูรายละเอียด"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* 2. มุมมอง Desktop (ตารางรายชื่อ) */}
      {/* ========================================== */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px] bg-white">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">เลขที่คำร้อง</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[200px]">ชื่อ - ข้อมูลนักศึกษา</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">วันที่ยื่น</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">ยอดกู้ยืมรวม</th>
              <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]">
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">{tx.id}</td>
                <td className="py-4 px-4 border-r border-gray-200">
                  <div className="font-bold text-gray-900">{tx.studentName}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{tx.studentId} • {tx.major}</div>
                </td>
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {tx.submitDate?.split(" ")[0] || "-"}
                </td>
                <td className="py-4 px-4 text-gray-900 font-bold border-r border-gray-200 whitespace-nowrap">
                  ฿{formatAmount(tx.totalAmount)}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => onSelectLoan(tx)} // เรียกฟังก์ชันที่ส่งมาจาก Props
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-[13px] font-bold rounded-lg border transition-colors ${
                      hasPendingSlip(tx.paymentHistory)
                        ? "bg-orange-50 hover:bg-orange-100 text-[#ea580c] border-orange-200"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm"
                    }`}
                  >
                    {hasPendingSlip(tx.paymentHistory) ? (
                      <><Receipt size={14} /> ตรวจสอบสลิปใหม่</>
                    ) : (
                      "ดูรายละเอียด"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}