// src/components/superadmin/setting/DisburseDebtCard.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  X,
  GraduationCap,
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  History,
  CreditCard,
  Phone,
  Landmark,
  CalendarDays,
  ShieldAlert,
  MessageSquare,
  SearchX,
  Copy,
  UploadCloud,
  FileImage,
  AlertCircle,
} from "lucide-react";

// ==========================================
// การกำหนด Type
// ==========================================
export type StudentInfo = {
  name: string;
  studentId: string;
  major: string;
  program?: string;
  year: string;
  phone: string;
};

export type BankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type LoanDetails = {
  objective: string;
  amount: string;
  term: string;
  expectedReturnDate?: string;
  bankDetails?: BankDetails;
};

export type RequestStatus = {
  submitDate: string;
  waitDays?: number;
  isOverdue?: boolean;
  history?: ActionHistory[];
};

export type ActionHistory = {
  action: string;
  date: string;
  actor: string;
};

export type PaymentBehaviorInfo = {
  onTimeStatusLabel?: string;
  onTimeInstallments?: number;
  lateInstallments?: number;
  totalLoanRequests?: number;
  totalInstallments?: number;
};

export type ApprovalStep = {
  step: "advisor" | "admin" | "executive";
  actorName: string;
  comment: string;
  decision: "approved" | "rejected" | "returned" | "pending";
  date: string;
};

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    requestStatus: string;
    paymentBehavior?: PaymentBehaviorInfo;
    approvals?: ApprovalStep[];
    paymentHistory?: any[];
    slipUrl?: string; // รองรับการแสดงรูปสลิป
  };

interface DisburseDebtCardProps {
  requests: ActionRequest[];
}

// ==========================================
// ฟังก์ชันตัวช่วยต่างๆ
// ==========================================
const thaiMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const formatAmount = (amountStr: string | number) => {
  const num = Number(amountStr);
  if (isNaN(num)) return amountStr;
  return num.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

function calculateInstallments(
  startDateStr: string,
  termStr: string,
  amountStr: string,
  paymentHistory?: any[],
) {
  const termsCount = parseInt(termStr, 10) || 0;
  const totalAmount = parseFloat(amountStr) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const baseAmount = totalAmount / termsCount;
  let schedule = Array.from({ length: termsCount }, (_, i) => ({
    installmentNumber: i + 1,
    expectedAmount: baseAmount,
    isPaid: false,
    paidAmount: 0,
  }));

  if (paymentHistory && Array.isArray(paymentHistory)) {
    paymentHistory.forEach((p) => {
      if (p.status === "verified" || p.status === "success") {
        const idx = p.installmentNumber - 1;
        if (schedule[idx]) {
          schedule[idx].isPaid = true;
          schedule[idx].paidAmount += Number(p.amount);
        }
      }
    });

    let totalExcess = 0;
    schedule.forEach((s) => {
      if (s.isPaid) {
        if (s.paidAmount > baseAmount) {
          totalExcess += s.paidAmount - baseAmount;
          s.expectedAmount = s.paidAmount;
        } else if (s.paidAmount < baseAmount) {
          s.expectedAmount = s.paidAmount;
        }
      }
    });

    for (let i = termsCount - 1; i >= 0 && totalExcess > 0; i--) {
      if (!schedule[i].isPaid) {
        if (schedule[i].expectedAmount >= totalExcess) {
          schedule[i].expectedAmount -= totalExcess;
          totalExcess = 0;
        } else {
          totalExcess -= schedule[i].expectedAmount;
          schedule[i].expectedAmount = 0;
        }
      }
    }
  }

  const parts = startDateStr.split(" ");
  let startDate: Date | null = null;
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthIdx = thaiMonths.indexOf(parts[1]);
    const year = parseInt(parts[2], 10) - 543;
    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      startDate = new Date(year, monthIdx, day);
    }
  }

  return schedule.map((s, i) => {
    let dateString = "-";
    if (startDate) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + (i + 1) * 30);
      dateString = `${nextDate.getDate()} ${thaiMonths[nextDate.getMonth()]} ${
        nextDate.getFullYear() + 543
      }`;
    }
    return { ...s, dateString };
  });
}

const getSubmittedTime = (req: ActionRequest) => {
  const submittedAt = req.history?.[0]?.date;
  const time = submittedAt?.match(/\d{1,2}:\d{2}/)?.[0];
  return time ? `${time} น.` : null;
};

const getRoleDisplay = (step: string) => {
  switch (step) {
    case "advisor":
      return "อ.ที่ปรึกษา";
    case "admin":
      return "เจ้าหน้าที่";
    case "executive":
      return "ผู้บริหาร";
    default:
      return step;
  }
};

function EmptyRequestsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="font-medium text-gray-700">ไม่พบข้อมูลที่ค้นหา</p>
      <p className="text-sm text-gray-500">ยังไม่มีข้อมูลในขณะนี้</p>
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================
export default function DisburseDebtCard({ requests }: DisburseDebtCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);

  // State สำหรับอัปโหลดสลิป & คัดลอกเลขบัญชี
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRequestHistory = selectedRequest?.history ?? [];
  const isCompleted =
    selectedRequest?.requestStatus === "disbursed" || selectedRequest?.requestStatus === "closed";

  const closeAllModals = () => {
    setSelectedRequest(null);
    setUploadedSlip(null);
    setIsCopied(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedSlip(imageUrl);
    }
  };

  return (
    <div className="w-full">
      {/* 1. มุมมองสำหรับ Mobile (แสดงเป็นการ์ด) */}
      <div className="md:hidden space-y-4">
        {requests.length === 0 ? (
          <EmptyRequestsState />
        ) : (
          requests.map((req, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-gray-900 text-[15px] leading-tight">
                    {req.name}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-1">
                    {req.studentId} • {req.major} • ปี {req.year}
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0 border border-gray-200">
                  {req.submitDate}
                </span>
              </div>
              <div className="text-[13px] text-gray-700 bg-orange-50/50 p-3 rounded-lg border border-orange-100/50 line-clamp-2">
                <span className="font-semibold text-gray-900">นำไปใช้: </span>
                {req.objective}
              </div>
              <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">จำนวนที่ขอ</div>
                  <div className="font-bold text-[#ea580c]">{formatAmount(req.amount)}</div>
                </div>
                {req.requestStatus !== "disbursed" && req.requestStatus !== "closed" ? (
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="px-4 py-2 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200"
                  >
                    ดำเนินการ
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm"
                  >
                    <CheckCircle2 size={15} className="shrink-0" /> ดูหลักฐาน
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full table-fixed text-left border-collapse min-w-[1050px] bg-white">
          <colgroup>
            <col className="w-[130px]" />
            <col className="w-[28%]" />
            <col className="w-[12%]" />
            <col className="w-[21%]" />
            <col className="w-[7.5%]" />
            <col className="w-[7.5%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                วันที่-เวลายื่นคำร้อง
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                รายละเอียดเพื่อนำไปใช้
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                จำนวนเงิน
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                จำนวนงวด
              </th>
              <th className="py-3.5 px-4 text-center font-bold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyRequestsState />
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
                >
                  <td className="py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200">
                    {req.id}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200">
                    <div className="font-bold text-gray-900 max-[1201px]:line-clamp-1">
                      {req.name}
                    </div>
                    <div className="mt-0.5 text-[13px] text-gray-500 max-[1201px]:truncate">
                      {req.studentId} • {req.major} • ปี {req.year}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200">
                    <div className="flex flex-col items-center">
                      <span>{req.submitDate}</span>
                      {getSubmittedTime(req) && <span>{getSubmittedTime(req)}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-left font-normal text-gray-700 border-r border-gray-200">
                    <div className="line-clamp-2">{req.objective}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-900 border-r border-gray-200">
                    {formatAmount(req.amount)}
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-700 border-r border-gray-200">
                    {req.term} งวด
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex justify-center">
                      {req.requestStatus !== "disbursed" && req.requestStatus !== "closed" ? (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200"
                        >
                          ดำเนินการ
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm"
                        >
                          <CheckCircle2 size={15} className="shrink-0" /> ดูหลักฐาน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Modal หลัก: ดำเนินการเบิกจ่ายเงิน / ดูหลักฐาน */}
      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className={isCompleted ? "text-green-600" : "text-[#ea580c]"} size={22} />
                  {isCompleted ? "หลักฐานการเบิกจ่ายเงิน" : "ดำเนินการเบิกจ่ายเงิน (Disbursement)"}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  อ้างอิงคำร้อง: {selectedRequest.id}
                </p>
              </div>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-4 text-left">
              {/* ข้อมูลนักศึกษา และ ยอดเงิน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">
                      {isCompleted ? "โอนเงินให้แก่" : "โอนเงินให้แก่นักศึกษา"}
                    </div>
                    <div className="font-bold text-gray-900 text-[15px] mt-0.5">
                      {selectedRequest.name}
                    </div>
                    <div className="text-[13px] text-gray-600 mt-0.5 flex items-center gap-2">
                      {selectedRequest.studentId} <span className="text-gray-300">|</span>{" "}
                      <Phone size={12} /> {selectedRequest.phone ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-start">
                  <div className="text-[13px] text-gray-500 mb-1 flex items-center gap-1.5">
                    <Wallet size={15} /> ยอดเงิน{isCompleted && "ที่โอนแล้ว"}
                  </div>
                  <div
                    className={`font-black text-[26px] leading-tight ${isCompleted ? "text-green-600" : "text-[#ea580c]"}`}
                  >
                    ฿{formatAmount(selectedRequest.amount)}
                  </div>
                </div>
              </div>

              {/* วันที่กำหนดชำระ (แบบตาราง) */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                  <CalendarDays size={15} className="text-[#ea580c]" /> กำหนดการผ่อนชำระ (
                  {selectedRequest.term} งวด)
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <th className="py-2.5 px-3 font-semibold text-center w-[25%]">งวดที่</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-[40%]">กำหนดชำระ</th>
                        <th className="py-2.5 px-3 font-semibold text-right w-[35%]">ยอดชำระ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateInstallments(
                        selectedRequest.submitDate,
                        selectedRequest.term,
                        selectedRequest.amount,
                        selectedRequest.paymentHistory,
                      ).map((inst) => (
                        <tr
                          key={inst.installmentNumber}
                          className={`border-b border-gray-100 last:border-0 ${inst.isPaid ? "bg-green-50/40" : ""}`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`font-medium ${inst.isPaid ? "text-green-700" : "text-gray-700"}`}
                              >
                                {inst.installmentNumber}
                              </span>
                              {inst.isPaid && <CheckCircle2 size={14} className="text-green-600" />}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {inst.dateString}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {inst.isPaid ? (
                              <span className="font-bold text-green-700">
                                ฿{formatAmount(inst.paidAmount)}
                              </span>
                            ) : (
                              <span
                                className={`font-bold ${inst.expectedAmount === 0 ? "text-gray-400" : "text-[#ea580c]"}`}
                              >
                                ฿{formatAmount(inst.expectedAmount)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* วัตถุประสงค์ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2.5 border-b border-gray-100 pb-2">
                  <FileText size={15} className="text-gray-400" /> มีความประสงค์ขอยืมเพื่อนำไปใช้
                </div>
                <p className="text-[14px] text-gray-800 leading-relaxed">
                  {selectedRequest.objective}
                </p>
              </div>

              {/* ============================================================== */}
              {/* ข้อมูลบัญชีรับเงิน (มีคัดลอก) และ อัปโหลดสลิป */}
              {/* ============================================================== */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-sm">
                <div className="text-[13px] font-bold text-blue-800 flex items-center gap-1.5 mb-3 border-b border-blue-100 pb-2">
                  <Landmark size={15} />{" "}
                  {isCompleted ? "บัญชีปลายทาง" : "โอนเข้าบัญชีรับเงิน (คัดลอกเพื่อโอนเงิน)"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="block text-[11px] text-gray-500 mb-0.5">ธนาคาร</span>
                    <span className="font-bold text-gray-900">
                      {selectedRequest.bankDetails?.bankName ?? "-"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="block text-[11px] text-gray-500 mb-0.5">ชื่อบัญชี</span>
                    <span className="font-bold text-gray-900">
                      {selectedRequest.bankDetails?.accountName ?? "-"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100 sm:col-span-2 flex justify-between items-center transition-all">
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-0.5">เลขที่บัญชี</span>
                      <span className="font-mono font-bold text-lg text-blue-700 tracking-wider">
                        {selectedRequest.bankDetails?.accountNumber ?? "-"}
                      </span>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => handleCopy(selectedRequest.bankDetails?.accountNumber ?? "")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                          isCopied
                            ? "bg-green-100 text-green-700 shadow-sm"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 size={14} /> คัดลอกแล้ว
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> คัดลอก
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* อัปโหลดสลิป / ดูสลิป */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                  <FileImage size={15} className="text-gray-400" />
                  {isCompleted ? "สลิปหลักฐานการโอนเงิน" : "แนบสลิปหลักฐานการโอนเงิน"}
                </div>

                {isCompleted ? (
                  // โหมดดูข้อมูล
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-2 flex justify-center items-center min-h-[200px]">
                    {selectedRequest.slipUrl ? (
                      <img
                        src={selectedRequest.slipUrl}
                        alt="slip proof"
                        className="max-h-[50vh] rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                        <FileImage size={40} className="mb-2 opacity-50" />
                        <p className="text-sm">ไม่พบรูปภาพหลักฐานการโอนเงิน</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // โหมดอัปโหลดไฟล์
                  <>
                    {uploadedSlip ? (
                      <div className="relative rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-2 flex justify-center items-center h-48 group">
                        <img
                          src={uploadedSlip}
                          alt="slip preview"
                          className="max-h-full rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => setUploadedSlip(null)}
                            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-50"
                          >
                            เปลี่ยนรูปภาพ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 transition-colors p-6 flex flex-col justify-center items-center h-48 cursor-pointer"
                      >
                        <UploadCloud size={32} className="text-gray-400 mb-2" />
                        <div className="text-[13px] font-bold text-gray-700">
                          คลิกเพื่ออัปโหลดสลิปโอนเงิน
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          รองรับ JPG, PNG หรือ PDF (ขนาดไม่เกิน 5MB)
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2 text-[12px] text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>
                        โปรดตรวจสอบชื่อบัญชีและเลขที่บัญชีให้ตรงกับข้อมูลนักศึกษาก่อนกดยืนยันการโอนเงินทุกครั้ง
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* ความเห็นประกอบการพิจารณาจาก Role ต่างๆ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                  <MessageSquare size={15} className="text-[#ea580c]" /> ความเห็นประกอบการพิจารณา
                </div>

                {selectedRequest.approvals && selectedRequest.approvals.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRequest.approvals.map((approval, idx) => {
                      let roleBadgeClass = "bg-gray-100 text-gray-700 border-gray-200";
                      let boxBgClass = "bg-gray-50 border-gray-100";

                      if (approval.step === "advisor") {
                        roleBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                        boxBgClass = "bg-emerald-50/40 border-emerald-100";
                      } else if (approval.step === "admin") {
                        roleBadgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                        boxBgClass = "bg-blue-50/40 border-blue-100";
                      } else if (approval.step === "executive") {
                        roleBadgeClass = "bg-purple-100 text-purple-800 border-purple-200";
                        boxBgClass = "bg-purple-50/40 border-purple-100";
                      }

                      return (
                        <div key={idx} className={`p-3.5 rounded-lg border ${boxBgClass}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                              <span className="font-bold text-gray-900 text-[13px]">
                                {approval.actorName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeClass}`}
                              >
                                {getRoleDisplay(approval.step)}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-500 shrink-0">
                              {approval.date}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-700 leading-relaxed italic">
                            &ldquo;{approval.comment}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                    <p className="text-[13px] text-gray-500">ยังไม่มีความเห็นประกอบการพิจารณา</p>
                  </div>
                )}
              </div>

              {/* พฤติกรรมการชำระ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                  <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-gray-400" /> ประวัติการชำระคืนกองทุน
                  </div>
                  <span
                    className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                      (selectedRequest.paymentBehavior?.lateInstallments ?? 0) === 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    ●{" "}
                    {(selectedRequest.paymentBehavior?.lateInstallments ?? 0) === 0
                      ? "ชำระตรงเวลา"
                      : "ชำระล่าช้า"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[11px] text-gray-500">ประวัติกู้ยืม</div>
                    <div className="font-bold text-[14px] text-gray-900 mt-0.5">
                      {selectedRequest.paymentBehavior?.totalLoanRequests ?? 0} ครั้ง
                    </div>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <div className="text-[11px] text-emerald-700">ตรงเวลา</div>
                    <div className="font-bold text-[14px] text-emerald-800 mt-0.5">
                      {selectedRequest.paymentBehavior?.onTimeInstallments ?? 0} งวด
                    </div>
                  </div>
                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[11px] text-gray-500">ล่าช้า</div>
                    <div className="font-bold text-[14px] text-gray-900 mt-0.5">
                      {selectedRequest.paymentBehavior?.lateInstallments ?? 0} งวด
                    </div>
                  </div>
                </div>
              </div>

              {/* ประวัติการดำเนินการ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-4 border-b border-gray-100 pb-2">
                  <History size={15} className="text-gray-400" /> ประวัติการดำเนินการ
                </div>
                {selectedRequestHistory.length > 0 ? (
                  <div className="relative border-l-2 border-blue-200 ml-2 space-y-5 mt-2">
                    {selectedRequestHistory.map((step, index) => (
                      <div key={index} className="relative pl-5">
                        <div
                          className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${
                            index === selectedRequestHistory.length - 1
                              ? "bg-blue-500 ring-4 ring-blue-50"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div
                          className={`font-bold text-[14px] ${index === selectedRequestHistory.length - 1 ? "text-gray-900" : "text-gray-600"}`}
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

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex gap-3 shrink-0">
              {isCompleted ? (
                <button
                  onClick={closeAllModals}
                  className="w-full py-3 flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all shadow-sm"
                >
                  ปิดหน้าต่าง
                </button>
              ) : (
                <>
                  <button
                    onClick={closeAllModals}
                    className="flex-1 py-3 text-[14px] font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    disabled={!uploadedSlip}
                    onClick={() => {
                      console.log(`Disbursed for ID: ${selectedRequest.id}`);
                      closeAllModals();
                    }}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-all shadow-sm ${
                      uploadedSlip
                        ? "bg-[#059669] hover:bg-[#047857] shadow-green-600/20"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle2 size={18} /> ยืนยันว่าโอนเงินแล้ว
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
