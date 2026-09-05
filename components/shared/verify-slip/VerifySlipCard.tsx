"use client";

import React, { useState } from "react";
import {
  X,
  GraduationCap,
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  Landmark,
  CalendarDays,
  ShieldAlert,
  Receipt,
  ShieldCheck,
  SearchX,
} from "lucide-react";

// ==========================================
// 1. Types
// ==========================================
export type PaymentEvidence = {
  id: string;
  installmentNumber: number;
  amount: string;
  paidAt: string;
  paidTime?: string;
  verifiedAt?: string;
  status: "pending" | "verified" | "rejected";
  slipImageUrl: string;
};

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

export type LoanStatus =
  | "draft"
  | "returned"
  | "pending_advisor"
  | "pending_admin"
  | "pending_executive"
  | "pending_disbursement"
  | "disbursed"
  | "closed"
  | "rejected"
  | "cancelled"
  | string;

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
    requestStatus: LoanStatus;
    paymentBehavior?: PaymentBehaviorInfo;
    approvals?: ApprovalStep[];
    paymentHistory?: PaymentEvidence[];
  };

export type UserRole = "advisor" | "executive" | "admin" | "super_admin";

interface VerifySlipCardProps {
  requests: ActionRequest[];
  userRole?: UserRole;
}

// ==========================================
// 2. Helper Functions
// ==========================================
const formatAmount = (amountStr: string | number) => {
  const num = Number(amountStr);
  if (isNaN(num)) return amountStr;
  return num.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const hasPendingSlip = (history?: PaymentEvidence[]) => {
  if (!history) return false;
  return history.some((ev) => ev.status === "pending");
};

function EmptySlipState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="font-medium text-gray-700">ไม่พบรายการสลิป</p>
      <p className="text-sm text-gray-500">
        อาจไม่มีคำร้องตามที่ค้นหา หรือยังไม่มีการแนบสลิปเข้ามา
      </p>
    </div>
  );
}

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

// ==========================================
// ฟังก์ชันคำนวณงวดชำระ
// ==========================================
function calculateInstallments(
  startDateStr: string,
  termStr: string,
  amountStr: string,
  paymentHistory?: PaymentEvidence[],
) {
  const termsCount = parseInt(termStr, 10) || 0;
  const totalAmount = parseFloat(amountStr) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const baseAmount = totalAmount / termsCount;

  // 1. สร้างโครงสร้าง
  const schedule = Array.from({ length: termsCount }, (_, i) => ({
    installmentNumber: i + 1,
    expectedAmount: baseAmount,
    isPaid: false,
    paidAmount: 0,
    evidence: null as PaymentEvidence | null,
  }));

  // 2. ดึงประวัติสลิปมาผูกกับงวด
  if (paymentHistory && Array.isArray(paymentHistory)) {
    paymentHistory.forEach((p) => {
      const idx = p.installmentNumber - 1;
      if (schedule[idx]) {
        schedule[idx].evidence = p;
        if (p.status === "verified") {
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

  // 3. หาวันที่
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

export default function VerifySlipCard({ requests, userRole = "admin" }: VerifySlipCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<PaymentEvidence | null>(null);
  const [slipConfirmAction, setSlipConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [slipRemark, setSlipRemark] = useState("");

  const canViewSensitiveData = userRole === "admin" || userRole === "super_admin";

  const closeAllModals = () => {
    setSelectedRequest(null);
    setSelectedEvidence(null);
    setSlipConfirmAction(null);
    setSlipRemark("");
  };

  const closeEvidenceModal = () => {
    setSelectedEvidence(null);
    setSlipConfirmAction(null);
    setSlipRemark("");
  };

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* มุมมอง Mobile */}
      {/* ========================================== */}
      <div className="md:hidden space-y-4">
        {requests.length === 0 ? (
          <EmptySlipState />
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
                  {req.submitDate?.split(" ")[0]}
                </span>
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">ยอดกู้ยืมรวม</div>
                  <div className="font-bold text-[#ea580c]">฿{formatAmount(req.amount)}</div>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="w-fit max-w-full px-4 py-2 text-[14px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200"
                >
                  <span className="block truncate">ตรวจสอบ</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================== */}
      {/* มุมมอง Desktop */}
      {/* ========================================== */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px] bg-white">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center min-w-[200px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                วันที่ยื่น
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                ยอดกู้ยืมรวม
              </th>
              <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptySlipState />
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
                >
                  <td className="py-4 px-4 text-center text-gray-600 border-r border-gray-200">
                    {req.id}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200">
                    <div className="font-bold text-gray-900 max-[1201px]:line-clamp-1">
                      {req.name}
                    </div>
                    <div className="text-[13px] text-gray-500 mt-0.5 max-[1201px]:truncate">
                      {req.studentId} • {req.major} • ปี {req.year}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    {req.submitDate?.split(" ")[0]}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-900 font-bold border-r border-gray-200 whitespace-nowrap">
                    ฿{formatAmount(req.amount)}
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="w-fit max-w-full px-3 py-1.5 text-[14px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200"
                      >
                        <span className="block truncate">ตรวจสอบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* Modal 1: รายละเอียดคำร้อง */}
      {/* ========================================== */}
      {selectedRequest && !selectedEvidence && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[700px] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                คำร้อง {selectedRequest.id}
              </h2>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-4">
              {/* ข้อมูลนักศึกษา */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                  <GraduationCap size={24} />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px]">
                    {selectedRequest.name}
                  </h3>
                  <div className="text-[13px] text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{selectedRequest.studentId}</span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span>
                      {selectedRequest.major} · ปี {selectedRequest.year}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2 ช่อง (จำนวนเงิน, กำหนดคืน) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Wallet size={14} /> จำนวนเงินที่ขอยืม
                  </div>
                  <div className="font-bold text-[16px] sm:text-[18px] text-[#ea580c]">
                    ฿{formatAmount(selectedRequest.amount)}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Clock size={14} /> จำนวนงวดที่ผ่อน
                  </div>
                  <div className="font-bold text-[14px] sm:text-[16px] text-gray-900 mt-1">
                    {selectedRequest.term} งวด
                  </div>
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

              {/* ข้อมูลบัญชีรับเงิน */}
              {canViewSensitiveData ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2.5 border-b border-gray-100 pb-2">
                    <Landmark size={15} className="text-[#ea580c]" /> โอนเข้าบัญชีรับเงิน
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[11px]">ธนาคาร</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.bankDetails?.bankName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[11px]">เลขที่บัญชี</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.bankDetails?.accountNumber}
                      </span>
                    </div>
                    <div className="flex flex-col sm:col-span-2">
                      <span className="text-gray-500 text-[11px]">ชื่อบัญชี</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.bankDetails?.accountName}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-center text-gray-500 gap-2 py-6">
                  <ShieldAlert size={18} />
                  <span className="text-[13px]">
                    ข้อมูลบัญชีธนาคารสงวนสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ
                  </span>
                </div>
              )}

              {/* ตารางรวบยอด: กำหนดการและประวัติการชำระเงิน */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-[#ea580c]" />{" "}
                    กำหนดการและประวัติการชำระเงิน
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <th className="py-2.5 px-3 font-semibold text-center w-[10%]">งวดที่</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-[25%]">กำหนดชำระ</th>
                        <th className="py-2.5 px-3 font-semibold text-right w-[20%]">
                          ยอดเรียกเก็บ
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right w-[20%]">ยอดที่ชำระ</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-[25%]">
                          สถานะ / สลิป
                        </th>
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
                          className={`border-b border-gray-100 last:border-0 ${
                            inst.isPaid ? "bg-green-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`font-medium ${
                                  inst.isPaid ? "text-green-700" : "text-gray-700"
                                }`}
                              >
                                {inst.installmentNumber}
                              </span>
                              {inst.isPaid && <CheckCircle2 size={14} className="text-green-600" />}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-600">{inst.dateString}</td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-bold ${
                                inst.expectedAmount === 0 ? "text-gray-400" : "text-gray-700"
                              }`}
                            >
                              ฿{formatAmount(inst.expectedAmount)}
                            </span>
                          </td>

                          {/* โชว์ยอดเงินและเวลา */}
                          <td className="py-3 px-3 text-right">
                            {inst.evidence ? (
                              <div className="flex flex-col items-end">
                                <span
                                  className={`font-bold ${
                                    inst.evidence.status === "verified"
                                      ? "text-green-700"
                                      : inst.evidence.status === "rejected"
                                        ? "text-red-700"
                                        : "text-[#ea580c]"
                                  }`}
                                >
                                  ฿{formatAmount(inst.evidence.amount)}
                                </span>
                                {/* แสดงเวลาถ้ามีข้อมูล */}
                                {inst.evidence.paidTime && (
                                  <span className="text-[10px] text-gray-500 mt-0.5">
                                    เวลา {inst.evidence.paidTime} น.
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 font-medium">-</span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-center">
                            {inst.evidence ? (
                              <button
                                onClick={() => setSelectedEvidence(inst.evidence!)}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors hover:shadow-sm w-full sm:w-auto
                                  ${
                                    inst.evidence.status === "verified"
                                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                      : inst.evidence.status === "pending"
                                        ? "bg-orange-50 text-[#ea580c] border-orange-200 hover:bg-orange-100"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  }`}
                              >
                                <Receipt size={14} className="shrink-0" />
                                {inst.evidence.status === "verified" && "ตรวจสอบแล้ว"}
                                {inst.evidence.status === "pending" && "รอตรวจสอบ"}
                                {inst.evidence.status === "rejected" && "ไม่อนุมัติ"}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[11px]">ยังไม่ชำระ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Modal 2: ตรวจสลิป (Sub-Modal เมื่อกดที่สลิป) */}
      {/* ========================================== */}
      {selectedEvidence && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-[#ea580c]" size={22} />
                  {selectedEvidence.status === "pending" ? "ตรวจสอบสลิป" : "รายละเอียดสลิป"}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  งวดที่ {selectedEvidence.installmentNumber}
                </p>
              </div>
              <button
                onClick={closeEvidenceModal}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body (Split View) */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-gray-50/50">
              {/* ซ้าย: รูป */}
              <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-center bg-gray-100/50 min-h-[300px]">
                <img
                  src={selectedEvidence.slipImageUrl}
                  alt="slip"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              </div>
              {/* ขวา: ข้อมูล */}
              <div className="w-full md:w-1/2 p-6 bg-white space-y-4 overflow-y-auto">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="text-[12px] text-gray-500 mb-1">ยอดที่โอนมา</div>
                  <div className="font-black text-[#ea580c] text-[24px]">
                    ฿{formatAmount(selectedEvidence.amount)}
                  </div>
                </div>

                {/* เพิ่มเวลาที่โอน และ แบ่งเป็น 2 คอลัมน์ */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-[12px] text-gray-500 mb-1">วันที่โอน</div>
                    <div className="font-bold text-gray-900">{selectedEvidence.paidAt}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-[12px] text-gray-500 mb-1">เวลาที่โอน</div>
                    <div className="font-bold text-gray-900">
                      {selectedEvidence.paidTime ? `${selectedEvidence.paidTime} น.` : "-"}
                    </div>
                  </div>
                </div>

                {selectedEvidence.status !== "pending" && (
                  <div
                    className={`p-4 rounded-xl border flex justify-between items-center ${
                      selectedEvidence.status === "verified"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    <div className="text-[13px] font-semibold">สถานะ</div>
                    <div className="font-bold">
                      {selectedEvidence.status === "verified" ? "ตรวจสอบสำเร็จ" : "ไม่อนุมัติ"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer ตรวจสอบ */}
            {selectedEvidence.status === "pending" && (
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                {!slipConfirmAction ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSlipConfirmAction("reject")}
                      className="flex-1 py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50"
                    >
                      ปฏิเสธสลิป
                    </button>
                    <button
                      onClick={() => setSlipConfirmAction("approve")}
                      className="flex-1 py-3 bg-[#059669] text-white font-bold rounded-xl hover:bg-[#047857]"
                    >
                      อนุมัติสลิป ถูกต้อง
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-[14px] mb-2">
                      {slipConfirmAction === "approve"
                        ? "ยืนยันการอนุมัติสลิป"
                        : "เหตุผลที่ปฏิเสธสลิป"}
                    </h4>
                    {slipConfirmAction === "reject" && (
                      <textarea
                        className="w-full border p-2 rounded-lg text-[13px] mb-3"
                        value={slipRemark}
                        onChange={(e) => setSlipRemark(e.target.value)}
                      />
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSlipConfirmAction(null)}
                        className="px-4 py-2 border rounded-lg text-[13px]"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={closeEvidenceModal}
                        className={`px-4 py-2 text-white font-bold rounded-lg text-[13px] ${
                          slipConfirmAction === "approve" ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
