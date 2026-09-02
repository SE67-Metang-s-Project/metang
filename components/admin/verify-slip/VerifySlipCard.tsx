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
// 1. กำหนด Type ข้อมูลการชำระเงิน
// ==========================================
export type PaymentTransaction = {
  id: string;
  studentId: string;
  studentName: string;
  installmentNumber: number;
  amount: string;
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
      {/* ส่วนที่ 1: ตารางรายการรอตรวจสอบ (Desktop) / การ์ด (Mobile) */}
      {/* ========================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[13px] uppercase tracking-wider">
                <th className="py-4 px-5 font-semibold">รหัสอ้างอิง / วันที่ส่ง</th>
                <th className="py-4 px-5 font-semibold">ข้อมูลนักศึกษา</th>
                <th className="py-4 px-5 font-semibold">รายการชำระ</th>
                <th className="py-4 px-5 font-semibold">ยอดเงิน</th>
                <th className="py-4 px-5 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-gray-900 text-[14px]">{tx.id}</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">{tx.submittedAt}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-gray-900 text-[14px]">{tx.studentName}</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">{tx.studentId}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-[13px] text-gray-700">
                      ชำระงวดที่ {tx.installmentNumber}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {tx.transferDate} {tx.transferTime} น.
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-[#ea580c] text-[15px]">
                      ฿{formatAmount(tx.amount)}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-center">
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
      </div>

      {/* ========================================== */}
      {/* ส่วนที่ 2: Modal ตรวจสอบสลิป (Split View) */}
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
                <p className="text-[13px] text-gray-500 mt-0.5">รายการอ้างอิง: {selectedTx.id}</p>
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
                      <div className="text-[11px] text-gray-500 mb-1">ยอดเงินที่ระบุ</div>
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
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0">
              {!confirmAction ? (
                <>
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    <XCircle size={18} /> ปฏิเสธสลิป (รูปไม่ชัด/ยอดไม่ตรง)
                  </button>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all"
                  >
                    <CheckCircle2 size={18} /> อนุมัติสลิป ถูกต้อง
                  </button>
                </>
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
                      placeholder="เช่น รูปสลิปเบลอ, ยอดโอนไม่ตรงกับที่ระบุ..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none h-20 mb-3"
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
