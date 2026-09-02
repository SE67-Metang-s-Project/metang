"use client";

import React, { useState } from "react";
import {
  X,
  GraduationCap,
  Wallet,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  CreditCard,
} from "lucide-react";
// ==========================================
// การกำหนด Type
// ==========================================
export type StudentInfo = {
  name: string;
  studentId: string;
  major: string;
  year: string;
};

export type LoanDetails = {
  objective: string;
  amount: string;
  term: string;
};

export type RequestStatus = {
  submitDate: string;
  waitDays: number;
  isOverdue: boolean;
  history: ActionHistory[];
};

export type ActionHistory = {
  action: string; // เช่น "ยื่นคำขอกู้ยืม", "อนุมัติ"
  date: string; // วันที่ดำเนินการ
  actor: string; // ชื่อผู้ดำเนินการ
};

export type PaymentBehaviorInfo = {
  onTimeStatusLabel?: string;
  onTimeInstallments?: number;
  lateInstallments?: number;
  totalLoanRequests?: number;
  totalInstallments?: number;
};

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    paymentBehavior?: PaymentBehaviorInfo;
  };

interface RequestsCardProps {
  requests: ActionRequest[];
}

const formatAmount = (amount: string) => Number(amount).toLocaleString("th-TH");

export default function RequestsCard({ requests }: RequestsCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");

  const closeAllModals = () => {
    setSelectedRequest(null);
    setConfirmAction(null);
    setRemark("");
  };

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* 1. มุมมองสำหรับ Mobile (แสดงเป็นการ์ด) */}
      {/* ========================================== */}
      <div className="md:hidden space-y-4">
        {requests.map((req, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold text-gray-900 text-[15px] leading-tight">{req.name}</div>
                <div className="text-[13px] text-gray-500 mt-1">
                  {req.studentId} • {req.major} • ปี {req.year}
                </div>
              </div>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0 border border-gray-200">
                {req.submitDate}
              </span>
            </div>

            <div className="text-[13px] text-gray-700 bg-orange-50/50 p-3 rounded-lg border border-orange-100/50 line-clamp-2">
              <span className="font-semibold text-gray-900">เหตุผล: </span>
              {req.objective}
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
              <div className="flex gap-4">
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">จำนวนที่ขอ</div>
                  <div className="text-[#ea580c]">฿{formatAmount(req.amount)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">ผ่อนชำระ</div>
                  <div className="font-bold text-gray-900">{req.term} งวด</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(req)}
                className="text-[#ea580c] hover:text-[#c2410c] font-bold text-[13px] bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors border border-orange-200"
              >
                ตรวจสอบ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
      {/* ========================================== */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full table-fixed border-collapse min-w-[900px] bg-white text-center">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[23%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300 whitespace-nowrap">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300 whitespace-nowrap">
                วันที่ยื่น
              </th>
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300">
                รายละเอียดคำร้อง
              </th>
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนเงิน
              </th>
              <th className="py-3.5 px-3 font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนงวด
              </th>
              <th className="py-3.5 px-3 font-semibold whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
              >
                <td className="py-4 px-3 font-normal text-gray-600 border-r border-gray-200">{req.id}</td>
                <td className="py-4 px-3 text-left border-r border-gray-200 font-normal">
                  <div className="font-normal text-gray-900">{req.name}</div>
                  <div className="mt-0.5 text-sm font-normal text-gray-500">
                    {req.studentId} • {req.major} • ปี {req.year}
                  </div>
                </td>
                <td className="py-4 px-3 font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {req.submitDate}
                </td>
                <td className="py-4 px-3 text-left font-normal text-gray-700 border-r border-gray-200">
                  <div className="break-words text-sm">{req.objective}</div>
                </td>
                <td className="py-4 px-3 font-normal text-gray-900 border-r border-gray-200 whitespace-nowrap">
                  ฿{formatAmount(req.amount)}
                </td>
                <td className="py-4 px-3 font-normal text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  {req.term} งวด
                </td>
                <td className="py-4 px-3 font-normal">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="bg-orange-50 px-3 py-1.5 font-normal text-[#ea580c] transition-colors hover:border-orange-200 hover:bg-orange-100 hover:text-[#c2410c] border border-transparent rounded-lg whitespace-nowrap"
                  >
                    ตรวจสอบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* 3. Modal หลัก: ตรวจสอบรายละเอียดคำร้อง */}
      {/* ========================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
              <div className="pr-2">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {selectedRequest.name}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  {selectedRequest.id} · ยื่นเมื่อ {selectedRequest.submitDate}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="hidden sm:inline-block bg-yellow-100 text-yellow-800 text-[12px] font-bold px-2.5 py-1 rounded-md">
                  {/* นำสถานะล่าสุดมาแสดงบน Header Modal */}
                  {selectedRequest.history[selectedRequest.history.length - 1]?.action}
                </span>
                <button
                  onClick={closeAllModals}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-4">
              {/* Badge สถานะสำหรับ Mobile (ย้ายมาไว้ข้างในหากจอเล็ก) */}
              <div className="sm:hidden mb-2">
                <span className="bg-yellow-100 text-yellow-800 text-[12px] font-bold px-2.5 py-1 rounded-md inline-block">
                  สถานะ: {selectedRequest.history[selectedRequest.history.length - 1]?.action}
                </span>
              </div>

              {/* ข้อมูลคณะ/สาขา */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[14px] sm:text-[15px]">
                    คณะพยาบาลศาสตร์
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {selectedRequest.major} · ปี {selectedRequest.year}
                  </p>
                </div>
              </div>

              {/* Grid 2 ช่อง (จำนวนเงิน, งวด) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Wallet size={14} /> จำนวนที่ขอ
                  </div>
                  <div className="font-bold text-[16px] sm:text-[18px] text-[#ea580c]">
                    ฿{formatAmount(selectedRequest.amount)}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Clock size={14} /> จำนวนงวดที่ผ่อน
                  </div>
                  <div className="font-bold text-[16px] sm:text-[18px] text-gray-900">
                    {selectedRequest.term} งวด
                  </div>
                </div>
              </div>

              {/* วัตถุประสงค์ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2.5 border-b border-gray-100 pb-2">
                  <FileText size={15} className="text-gray-400" /> รายละเอียดคำร้อง
                </div>
                <p className="text-[14px] text-gray-800 leading-relaxed">
                  {selectedRequest.objective}
                </p>
              </div>

              {/* พฤติกรรมการชำระ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                  <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-[#ea580c]" /> พฤติกรรมการชำระ
                  </div>
                  <span
                    className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                      (selectedRequest.paymentBehavior?.lateInstallments ?? 0) === 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    ● {selectedRequest.paymentBehavior?.onTimeStatusLabel ?? "ชำระตรงเวลา"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[11px] text-gray-500">ประวัติกู้ยืม</div>
                    <div className="font-bold text-[14px] text-gray-900 mt-0.5">
                      {selectedRequest.paymentBehavior?.totalLoanRequests ?? 3} ครั้ง
                    </div>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <div className="text-[11px] text-emerald-700">ตรงเวลา</div>
                    <div className="font-bold text-[14px] text-emerald-800 mt-0.5">
                      {selectedRequest.paymentBehavior?.onTimeInstallments ?? 12} งวด
                    </div>
                  </div>
                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[11px] text-gray-500">ล่าช้า</div>
                    <div className="font-bold text-[14px] text-gray-900 mt-0.5">
                      {selectedRequest.paymentBehavior?.lateInstallments ?? 0} งวด
                    </div>
                  </div>
                </div>

                <p className="text-[12px] text-gray-500 mt-2.5 pt-2 border-t border-gray-100">
                  กู้ยืมทั้งหมด {selectedRequest.paymentBehavior?.totalLoanRequests ?? 3} ครั้ง ·
                  แบ่งจ่ายจำนวน {selectedRequest.paymentBehavior?.totalInstallments ?? 12} งวด
                </p>
              </div>

              {/* ประวัติการดำเนินการ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-4 border-b border-gray-100 pb-2">
                  <History size={15} className="text-gray-400" />
                  ประวัติการดำเนินการ
                </div>

                {selectedRequest.history && selectedRequest.history.length > 0 ? (
                  <div className="relative border-l-2 border-blue-200 ml-2 space-y-5 mt-2">
                    {selectedRequest.history.map((step, index) => (
                      <div key={index} className="relative pl-5">
                        <div
                          className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${
                            index === selectedRequest.history.length - 1
                              ? "bg-blue-500 ring-4 ring-blue-50"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div
                          className={`font-bold text-[14px] ${index === selectedRequest.history.length - 1 ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {step.action}
                        </div>
                        <div className="text-[12px] sm:text-[13px] text-gray-500 mt-0.5">
                          {step.date} · {step.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">
                    ยังไม่มีประวัติการดำเนินการ
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons - แสดงเฉพาะเมื่อสถานะล่าสุดคือ "ยื่นคำขอกู้ยืม" เท่านั้น */}
            {selectedRequest.history &&
              selectedRequest.history.length > 0 &&
              selectedRequest.history[selectedRequest.history.length - 1].action ===
                "ยื่นคำขอกู้ยืม" && (
                <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
                  >
                    <XCircle size={18} /> ไม่อนุมัติ
                  </button>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="w-full sm:flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={18} /> อนุมัติ
                  </button>
                </div>
              )}

            {/* ========================================== */}
            {/* 4. Modal ย่อย: ยืนยันการพิจารณา */}
            {/* ========================================== */}
            {confirmAction && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  {/* Header ยืนยัน */}
                  <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                    <h3
                      className={`font-bold text-[16px] ${confirmAction === "approve" ? "text-green-700" : "text-red-600"}`}
                    >
                      {confirmAction === "approve"
                        ? "ยืนยันการอนุมัติ"
                        : "ระบุเหตุผลในการไม่อนุมัติ"}
                    </h3>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-full"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Body ยืนยัน */}
                  <div className="p-5">
                    <p className="text-[13px] text-gray-600 mb-3">
                      {confirmAction === "approve"
                        ? "คุณสามารถเพิ่มความเห็นประกอบ (ถ้ามี) ก่อนส่งต่อให้เจ้าหน้าที่ดำเนินการต่อ"
                        : "กรุณาระบุเหตุผลเพื่อแจ้งกลับให้นักศึกษาทราบและดำเนินการแก้ไข"}
                    </p>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-3.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none h-28 bg-gray-50/50"
                      placeholder={
                        confirmAction === "approve"
                          ? "เช่น นักศึกษามีผลการเรียนดี..."
                          : "เช่น เอกสารรับรองรายได้ไม่สมบูรณ์..."
                      }
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Footer ยืนยัน */}
                  <div className="px-5 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2.5 bg-gray-50/50">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="w-full sm:w-auto px-5 py-2.5 text-[14px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => {
                        console.log(
                          `Action: ${confirmAction}, Request: ${selectedRequest.id}, Remark: ${remark}`,
                        );
                        closeAllModals();
                      }}
                      className={`w-full sm:w-auto px-5 py-2.5 text-[14px] font-bold text-white rounded-xl transition-colors shadow-sm ${
                        confirmAction === "approve"
                          ? "bg-[#059669] hover:bg-[#047857] shadow-green-600/20"
                          : "bg-[#e11d48] hover:bg-[#be123c] shadow-red-600/20"
                      }`}
                    >
                      {confirmAction === "approve" ? "ยืนยันอนุมัติ" : "ยืนยันไม่อนุมัติ"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
