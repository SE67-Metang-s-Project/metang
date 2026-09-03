"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  User,
  Image as ImageIcon,
  Receipt,
  Landmark,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// 1. กำหนด Type ข้อมูลการชำระเงิน (เพิ่ม totalDebt)
// ==========================================
export type PaymentTransaction = {
  id: string; // เลขที่คำร้อง
  studentId: string;
  studentName: string;
  installmentNumber: number;
  amount: string; // ยอดที่โอนมา
  totalDebt: string; // หนี้รวม
  transferDate: string;
  transferTime: string;
  bankFrom: string;
  bankTo: string;
  slipImageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

interface VerifySlipCardProps {
  transactions: PaymentTransaction[];
}

export default function VerifySlipCard({ transactions }: VerifySlipCardProps) {
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");

  const closeAllModals = () => {
    setSelectedTx(null);
    setConfirmAction(null);
    setRemark("");
  };

  const formatAmount = (amountStr: string) => {
    const num = Number(amountStr);
    return isNaN(num) ? amountStr : num.toLocaleString();
  };

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* ส่วนที่ 1: มุมมอง Mobile (การ์ด) */}
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
                {tx.submittedAt}
              </span>
            </div>

            <div className="text-[13px] text-gray-700 bg-orange-50/50 p-3 rounded-lg border border-orange-100/50 flex justify-between">
              <span className="font-medium text-gray-800">ชำระงวดที่ {tx.installmentNumber}</span>
              <span className="text-gray-500">หนี้รวม: ฿{formatAmount(tx.totalDebt)}</span>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">ยอดโอนมา</div>
                <div className="font-bold text-[#ea580c]">฿{formatAmount(tx.amount)}</div>
              </div>
              {tx.status === "pending" ? (
                <button
                  onClick={() => setSelectedTx(tx)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#ea580c] text-[13px] font-bold rounded-lg border border-orange-200 transition-colors"
                >
                  <Receipt size={14} /> ตรวจสอบ
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${
                    tx.status === "approved"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {tx.status === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* ส่วนที่ 2: มุมมอง Desktop (ตาราง) */}
      {/* ========================================== */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px] bg-white">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">เลขที่คำร้อง</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[200px]">ชื่อ</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">รายการชำระ</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">หนี้รวม</th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">ยอดเงินที่โอนมา</th>
              <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]">
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">{tx.id}</td>
                <td className="py-4 px-4 border-r border-gray-200">
                  <div className="font-bold text-gray-900">{tx.studentName}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{tx.studentId}</div>
                </td>
                <td className="py-4 px-4 text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  ชำระงวดที่ {tx.installmentNumber}
                  <div className="text-[12px] text-gray-500 mt-0.5">{tx.transferDate}</div>
                </td>
                <td className="py-4 px-4 text-gray-900 font-medium border-r border-gray-200 whitespace-nowrap">
                  ฿{formatAmount(tx.totalDebt)}
                </td>
                <td className="py-4 px-4 font-bold text-[#ea580c] border-r border-gray-200 whitespace-nowrap">
                  ฿{formatAmount(tx.amount)}
                </td>
                <td className="py-4 px-4 text-center">
                  {tx.status === "pending" ? (
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#ea580c] text-[13px] font-bold rounded-lg border border-orange-200 transition-colors"
                    >
                      <Receipt size={14} /> ตรวจสอบสลิป
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${
                        tx.status === "approved"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {tx.status === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* ส่วนที่ 3: Modal ตรวจสอบสลิป (Split View) */}
      {/* ========================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-[#ea580c]" size={22} />
                  ตรวจสอบความถูกต้องของการชำระเงิน
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">เลขที่คำร้อง: {selectedTx.id}</p>
              </div>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body (Split View) */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-gray-50/50">
              {/* ฝั่งซ้าย: รูปสลิป */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col overflow-y-auto bg-gray-100/50">
                <div className="text-[13px] font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <ImageIcon size={16} /> หลักฐานการโอนเงิน (e-Slip)
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center p-2 min-h-[300px] md:min-h-0 relative group">
                  <img
                    src={selectedTx.slipImageUrl}
                    alt="slip"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* ฝั่งขวา: ข้อมูลที่ระบบบันทึก */}
              <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto bg-white">
                <div className="text-[13px] font-semibold text-gray-600 mb-4 border-b border-gray-100 pb-2">
                  รายละเอียดที่แจ้งในระบบ
                </div>

                <div className="space-y-5">
                  {/* ข้อมูลนักศึกษา */}
                  <div className="flex items-center gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">ผู้ชำระเงิน</div>
                      <div className="font-bold text-gray-900 text-[14px]">
                        {selectedTx.studentName}
                      </div>
                      <div className="text-[12px] text-gray-600">รหัส: {selectedTx.studentId}</div>
                    </div>
                  </div>

                  {/* ยอดเงินและงวด */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                      <div className="text-[11px] text-gray-500 mb-1">ยอดเงินที่โอนมา</div>
                      <div className="font-black text-[#ea580c] text-[20px]">
                        ฿{formatAmount(selectedTx.amount)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="text-[11px] text-gray-500 mb-1">ชำระสำหรับ</div>
                      <div className="font-bold text-gray-900 text-[16px]">
                        งวดที่ {selectedTx.installmentNumber}
                      </div>
                    </div>
                  </div>

                  {/* หนี้รวม */}
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 flex justify-between items-center">
                    <div className="text-[13px] font-semibold text-red-700">ยอดหนี้รวมของคำร้องนี้</div>
                    <div className="font-bold text-[16px] text-red-700">฿{formatAmount(selectedTx.totalDebt)}</div>
                  </div>

                  {/* วันที่และเวลาโอน */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <CalendarDays size={16} className="text-gray-400" /> วันที่โอน
                      </div>
                      <div className="font-bold text-gray-900 text-[14px]">
                        {selectedTx.transferDate}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Clock size={16} className="text-gray-400" /> เวลาที่โอน
                      </div>
                      <div className="font-bold text-gray-900 text-[14px]">
                        {selectedTx.transferTime} น.
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลบัญชี */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Landmark size={16} className="text-gray-400" /> โอนจาก
                      </div>
                      <div className="font-medium text-gray-900 text-[13px]">
                        {selectedTx.bankFrom}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Landmark size={16} className="text-emerald-500" /> เข้าบัญชี
                      </div>
                      <div className="font-medium text-gray-900 text-[13px]">
                        {selectedTx.bankTo}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col shrink-0">
              {!confirmAction ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    <XCircle size={18} /> ปฏิเสธสลิป (ยอดไม่ตรง/สลิปปลอม)
                  </button>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all"
                  >
                    <CheckCircle2 size={18} /> อนุมัติสลิป ถูกต้อง
                  </button>
                </div>
              ) : (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                  <h4
                    className={`font-bold text-[14px] mb-2 flex items-center gap-2 ${confirmAction === "approve" ? "text-green-700" : "text-red-600"}`}
                  >
                    {confirmAction === "approve" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    {confirmAction === "approve"
                      ? "ยืนยันการอนุมัติสลิป"
                      : "ระบุเหตุผลที่ปฏิเสธสลิป"}
                  </h4>

                  {confirmAction === "reject" && (
                    <textarea
                      placeholder="เช่น รูปสลิปเบลอ, ยอดโอนไม่ตรงกับที่ระบุ, ไม่พบยอดเงินเข้าบัญชี..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none h-20 mb-3 bg-white"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      autoFocus
                    />
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => {
                        console.log(
                          `Action: ${confirmAction}, ID: ${selectedTx.id}, Remark: ${remark}`,
                        );
                        closeAllModals();
                      }}
                      className={`px-4 py-2 text-[13px] font-bold text-white rounded-lg shadow-sm ${
                        confirmAction === "approve"
                          ? "bg-[#059669] hover:bg-[#047857]"
                          : "bg-[#dc2626] hover:bg-[#b91c1c]"
                      }`}
                    >
                      {confirmAction === "approve" ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}