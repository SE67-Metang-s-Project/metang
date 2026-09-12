// components/shared/verify-slip/VerifySlipCard.tsx
"use client";

import React, { useState } from "react";
import {
  X,
  UserRound,
  Landmark,
  HandCoins,
  CalendarDays,
  CreditCard,
  MessageSquare,
  History,
  CheckCircle2,
  Receipt,
  ShieldAlert,
  SearchX,
} from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import styles from "@/app/student/student.module.css";

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
  degree?: string;
  educationLevel?: string;
  year: string;
  phone?: string;
  advisorName?: string;
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
  additionalNote?: string;
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

export const hasPendingSlip = (history?: PaymentEvidence[]) => {
  if (!history) return false;
  return history.some((ev) => ev.status === "pending");
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

// ==========================================
// Main Component
// ==========================================
export default function VerifySlipCard({ requests, userRole = "admin" }: VerifySlipCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<PaymentEvidence | null>(null);
  const [slipConfirmAction, setSlipConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [slipRemark, setSlipRemark] = useState("");

  const canViewSensitiveData = userRole === "admin" || userRole === "super_admin";
  const selectedRequestHistory = selectedRequest?.history ?? [];

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

  const isEvidenceModalOpen = Boolean(selectedEvidence && selectedRequest);
  const isRequestModalOpen = Boolean(selectedRequest && !selectedEvidence);

  const requestModalDismiss = useModalDismiss({
    onClose: closeAllModals,
    isOpen: isRequestModalOpen,
  });

  const evidenceModalDismiss = useModalDismiss({
    onClose: closeEvidenceModal,
    isOpen: isEvidenceModalOpen,
  });

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* 1. มุมมอง Mobile (แสดงเป็นการ์ด) */}
      {/* ========================================== */}
      <div className="md:hidden space-y-4">
        {requests.length === 0 ? (
          <EmptySlipState />
        ) : (
          requests.map((req, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md"
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
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md shrink-0 border border-gray-200">
                  {req.submitDate?.split(" ")[0]}
                </span>
              </div>

              <div className="text-[13px] text-gray-700 bg-orange-50/40 p-3 rounded-xl border border-orange-100/60 line-clamp-2">
                <span className="font-semibold text-gray-900">นำไปใช้: </span>
                {req.objective}
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
                <div className="flex gap-4">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">ยอดกู้ยืมรวม</div>
                    <div className="font-bold text-[#ea580c]">฿{formatAmount(req.amount)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">จำนวนงวด</div>
                    <div className="font-medium text-gray-700 text-[14px]">{req.term} งวด</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="w-fit max-w-full px-4 py-2 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer"
                >
                  <span className="block truncate">ตรวจสอบ</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================== */}
      {/* 2. มุมมอง Desktop/Tablet (แสดงเป็นตาราง) */}
      {/* ========================================== */}
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
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center min-w-[200px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                วันที่ยื่น
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[200px] text-center">
                รายละเอียดเพื่อนำไปใช้
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                ยอดกู้ยืมรวม
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 text-center whitespace-nowrap">
                จำนวนงวด
              </th>
              <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptySlipState />
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
                >
                  <td className="py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
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
                  <td className="py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    {req.submitDate?.split(" ")[0]}
                  </td>
                  <td className="py-4 px-4 text-left font-normal text-gray-700 border-r border-gray-200">
                    <div className="line-clamp-2">{req.objective}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-900 border-r border-gray-200 whitespace-nowrap">
                    ฿{formatAmount(req.amount)}
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-700 border-r border-gray-200 whitespace-nowrap">
                    {req.term} งวด
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="w-fit max-w-full px-3 py-1.5 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer"
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
      {/* 3. Modal 1: รายละเอียดคำร้องและตารางชำระเงิน */}
      {/* ========================================== */}
      {selectedRequest && !selectedEvidence && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          {...requestModalDismiss}
          role="presentation"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-5 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="pr-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  คำร้อง {selectedRequest.id}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  ยื่นเมื่อ {selectedRequest.submitDate}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={closeAllModals}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {hasPendingSlip(selectedRequest.paymentHistory) && (
                <div className={styles.loanApprovalWarning}>
                  มีรายการสลิปที่รอการตรวจสอบ กรุณาตรวจสอบสลิปการชำระเงินในตารางด้านล่าง
                </div>
              )}

              {/* ข้อมูลนักศึกษา */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ข้อมูลนักศึกษา"
                />
                <dl>
                  <div>
                    <dt>ชื่อ-นามสกุล</dt>
                    <dd>{selectedRequest.name}</dd>
                  </div>
                  <div>
                    <dt>รหัสนักศึกษา</dt>
                    <dd>{selectedRequest.studentId}</dd>
                  </div>
                  <div>
                    <dt>คณะ</dt>
                    <dd>คณะพยาบาลศาสตร์</dd>
                  </div>
                  <div>
                    <dt>หลักสูตร</dt>
                    <dd>
                      {selectedRequest.program || selectedRequest.major || "พยาบาลศาสตรบัณฑิต"}
                    </dd>
                  </div>
                  <div>
                    <dt>วุฒิการศึกษา</dt>
                    <dd>
                      {selectedRequest.degree || selectedRequest.educationLevel || "ปริญญาตรี"}
                    </dd>
                  </div>
                  <div>
                    <dt>ชั้นปีการศึกษา</dt>
                    <dd>ชั้นปีที่ {selectedRequest.year}</dd>
                  </div>
                  <div>
                    <dt>เบอร์โทรศัพท์</dt>
                    <dd>{selectedRequest.phone || "-"}</dd>
                  </div>
                  {selectedRequest.advisorName && (
                    <div>
                      <dt>อาจารย์ที่ปรึกษา</dt>
                      <dd>{selectedRequest.advisorName}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* ข้อมูลธนาคาร */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ข้อมูลธนาคาร"
                />
                {canViewSensitiveData ? (
                  <dl>
                    <div>
                      <dt>ธนาคาร</dt>
                      <dd>{selectedRequest.bankDetails?.bankName || "-"}</dd>
                    </div>
                    <div>
                      <dt>เลขที่บัญชี</dt>
                      <dd>{selectedRequest.bankDetails?.accountNumber || "-"}</dd>
                    </div>
                    <div>
                      <dt>ชื่อบัญชี</dt>
                      <dd>{selectedRequest.bankDetails?.accountName || "-"}</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-gray-500 text-[13px] bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                    <ShieldAlert size={18} className="text-amber-500 shrink-0" />
                    <span>ข้อมูลบัญชีธนาคารสงวนสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ</span>
                  </div>
                )}
              </section>

              {/* ข้อมูลการกู้ยืม */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<HandCoins aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ข้อมูลการกู้ยืม"
                />
                <dl>
                  <div>
                    <dt>วัตถุประสงค์การกู้ยืม</dt>
                    <dd>{selectedRequest.objective || "-"}</dd>
                  </div>
                  {selectedRequest.additionalNote && (
                    <div>
                      <dt>หมายเหตุเพิ่มเติม</dt>
                      <dd>{selectedRequest.additionalNote}</dd>
                    </div>
                  )}
                  <div className={styles.loanAmountRow}>
                    <dt>ยอดกู้ยืมรวม (บาท)</dt>
                    <dd className="font-bold text-[#ea580c]">
                      ฿{formatAmount(selectedRequest.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt>จำนวนเงินตัวอักษร</dt>
                    <dd className={styles.loanAmountText}>
                      {formatThaiBahtText(String(selectedRequest.amount))}
                    </dd>
                  </div>
                  <div>
                    <dt>จำนวนงวดการชำระ</dt>
                    <dd>{selectedRequest.term} งวด</dd>
                  </div>
                </dl>
              </section>

              {/* ตารางกำหนดการและประวัติการชำระเงิน */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<CalendarDays aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="กำหนดการและประวัติการชำระเงิน"
                />

                <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-[13px]">
                        <th className="py-2.5 px-3 font-semibold text-center w-[12%]">งวดที่</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-[23%]">กำหนดชำระ</th>
                        <th className="py-2.5 px-3 font-semibold text-right w-[20%]">ยอดเรียกเก็บ</th>
                        <th className="py-2.5 px-3 font-semibold text-right w-[20%]">ยอดที่ชำระ</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-[25%]">สถานะ / สลิป</th>
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
                            inst.isPaid ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`font-medium ${
                                  inst.isPaid ? "text-emerald-700 font-bold" : "text-gray-700"
                                }`}
                              >
                                {inst.installmentNumber}
                              </span>
                              {inst.isPaid && (
                                <CheckCircle2 size={14} className="text-emerald-600" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-600 whitespace-nowrap">
                            {inst.dateString}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-semibold ${
                                inst.expectedAmount === 0 ? "text-gray-400" : "text-gray-700"
                              }`}
                            >
                              ฿{formatAmount(inst.expectedAmount)}
                            </span>
                          </td>

                          {/* ยอดเงินที่ชำระ */}
                          <td className="py-3 px-3 text-right">
                            {inst.evidence ? (
                              <div className="flex flex-col items-end">
                                <span
                                  className={`font-bold ${
                                    inst.evidence.status === "verified"
                                      ? "text-emerald-700"
                                      : inst.evidence.status === "rejected"
                                        ? "text-red-700"
                                        : "text-[#ea580c]"
                                  }`}
                                >
                                  ฿{formatAmount(inst.evidence.amount)}
                                </span>
                                {inst.evidence.paidTime && (
                                  <span className="text-[10px] text-gray-500 mt-0.5">
                                    {inst.evidence.paidTime} น.
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 font-normal">-</span>
                            )}
                          </td>

                          {/* ปุ่มสถานะ / ตรวจสอบสลิป */}
                          <td className="py-2.5 px-3 text-center">
                            {inst.evidence ? (
                              <button
                                onClick={() => setSelectedEvidence(inst.evidence!)}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                                  inst.evidence.status === "verified"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : inst.evidence.status === "pending"
                                      ? "bg-orange-50 text-[#ea580c] border-orange-200 hover:bg-orange-100"
                                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                                type="button"
                              >
                                <Receipt size={13} className="shrink-0" />
                                {inst.evidence.status === "verified" && "ตรวจสอบแล้ว"}
                                {inst.evidence.status === "pending" && "รอตรวจสอบ"}
                                {inst.evidence.status === "rejected" && "ไม่อนุมัติ"}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[12px]">ยังไม่ชำระ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ความเห็นประกอบการพิจารณา */}
              {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                <section className={styles.loanApprovalInfoCard}>
                  <CardHeader
                    className={styles.sectionCardHeading}
                    icon={<MessageSquare aria-hidden="true" size={20} strokeWidth={2.2} />}
                    title="ความเห็นประกอบการพิจารณา"
                  />
                  <div className="space-y-3 pt-1">
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
                        <div key={idx} className={`p-3.5 rounded-xl border ${boxBgClass}`}>
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
                </section>
              )}

              {/* ประวัติการชำระคืนกองทุน */}
              {selectedRequest.paymentBehavior && (
                <section className={styles.loanApprovalInfoCard}>
                  <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-gray-200">
                    <header className="flex items-center gap-2">
                      <CreditCard
                        aria-hidden="true"
                        size={20}
                        strokeWidth={2.2}
                        className="text-gray-400"
                      />
                      <h3 className="m-0 text-gray-900 text-[17px] font-semibold">
                        ประวัติการชำระคืนกองทุน
                      </h3>
                    </header>
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
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-[11px] text-gray-500">ประวัติกู้ยืม</div>
                      <div className="font-bold text-[15px] text-gray-900 mt-0.5">
                        {selectedRequest.paymentBehavior?.totalLoanRequests ?? 0} ครั้ง
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <div className="text-[11px] text-emerald-700 font-medium">ตรงเวลา</div>
                      <div className="font-bold text-[15px] text-emerald-800 mt-0.5">
                        {selectedRequest.paymentBehavior?.onTimeInstallments ?? 0} งวด
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-[11px] text-gray-500">ล่าช้า</div>
                      <div className="font-bold text-[15px] text-gray-900 mt-0.5">
                        {selectedRequest.paymentBehavior?.lateInstallments ?? 0} งวด
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ประวัติการดำเนินการ */}
              {selectedRequestHistory.length > 0 && (
                <section className={styles.loanApprovalInfoCard}>
                  <CardHeader
                    className={styles.sectionCardHeading}
                    icon={<History aria-hidden="true" size={20} strokeWidth={2.2} />}
                    title="ประวัติการดำเนินการ"
                  />
                  <div className="relative border-l-2 border-orange-200 ml-2.5 space-y-4 my-2">
                    {selectedRequestHistory.map((step, index) => (
                      <div key={index} className="relative pl-5">
                        <div
                          className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ${
                            index === selectedRequestHistory.length - 1
                              ? "bg-[#ea580c] ring-4 ring-orange-100"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div
                          className={`font-bold text-[14px] ${
                            index === selectedRequestHistory.length - 1
                              ? "text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {step.action}
                        </div>
                        <div className="text-[12px] text-gray-500 mt-0.5">
                          {step.date} · {step.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Footer Modal 1 */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex shrink-0">
              <button
                onClick={closeAllModals}
                className="w-full py-3 flex items-center justify-center rounded-xl text-[14px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                type="button"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. Modal 2: ตรวจสลิป (Sub-Modal เมื่อกดดูสลิป) */}
      {/* ========================================== */}
      {selectedEvidence && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-sm"
          {...evidenceModalDismiss}
          role="presentation"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal 2 */}
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
              <div className="pr-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {selectedEvidence.status === "pending" ? "ตรวจสอบสลิปการชำระเงิน" : "รายละเอียดสลิปการชำระเงิน"}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  คำร้อง {selectedRequest.id} · งวดที่ {selectedEvidence.installmentNumber}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={`text-[12px] font-bold px-3 py-1 rounded-full border ${
                    selectedEvidence.status === "verified"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedEvidence.status === "pending"
                        ? "bg-orange-50 text-[#ea580c] border-orange-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  ●{" "}
                  {selectedEvidence.status === "verified"
                    ? "ตรวจสอบแล้ว"
                    : selectedEvidence.status === "pending"
                      ? "รอตรวจสอบ"
                      : "ไม่อนุมัติ"}
                </span>
                <button
                  onClick={closeEvidenceModal}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body (Split View) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {selectedEvidence.status === "pending" && (
                <div className={styles.loanApprovalWarning}>
                  กรุณาตรวจสอบความถูกต้องของยอดเงิน วันที่ และเวลาในสลิปกับข้อมูลที่นักศึกษาระบุ
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ซ้าย: รูปสลิป */}
                <section className={styles.loanApprovalInfoCard}>
                  <CardHeader
                    className={styles.sectionCardHeading}
                    icon={<Receipt aria-hidden="true" size={20} strokeWidth={2.2} />}
                    title="รูปภาพสลิปโอนเงิน"
                  />
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-2 flex justify-center items-center min-h-[260px] mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedEvidence.slipImageUrl}
                      alt="สลิปหลักฐานการโอนเงิน"
                      className="max-h-[48vh] w-auto max-w-full rounded-lg shadow-sm object-contain"
                    />
                  </div>
                </section>

                {/* ขวา: ข้อมูลสลิปและนักศึกษา */}
                <div className="space-y-4">
                  {/* ข้อมูลการชำระเงิน */}
                  <section className={styles.loanApprovalInfoCard}>
                    <CardHeader
                      className={styles.sectionCardHeading}
                      icon={<HandCoins aria-hidden="true" size={20} strokeWidth={2.2} />}
                      title="ข้อมูลการชำระเงิน"
                    />
                    <dl>
                      <div className={styles.loanAmountRow}>
                        <dt>ยอดเงินที่โอนมา (บาท)</dt>
                        <dd className="font-bold text-[#ea580c]">
                          ฿{formatAmount(selectedEvidence.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt>จำนวนเงินตัวอักษร</dt>
                        <dd className={styles.loanAmountText}>
                          {formatThaiBahtText(String(selectedEvidence.amount))}
                        </dd>
                      </div>
                      <div>
                        <dt>วันที่โอน</dt>
                        <dd>{selectedEvidence.paidAt}</dd>
                      </div>
                      <div>
                        <dt>เวลาที่โอน</dt>
                        <dd>{selectedEvidence.paidTime ? `${selectedEvidence.paidTime} น.` : "-"}</dd>
                      </div>
                      <div>
                        <dt>สถานะการตรวจสอบ</dt>
                        <dd>
                          <span
                            className={`font-semibold ${
                              selectedEvidence.status === "verified"
                                ? "text-emerald-700"
                                : selectedEvidence.status === "pending"
                                  ? "text-[#ea580c]"
                                  : "text-red-600"
                            }`}
                          >
                            {selectedEvidence.status === "verified"
                              ? "ตรวจสอบแล้ว"
                              : selectedEvidence.status === "pending"
                                ? "รอตรวจสอบ"
                                : "ไม่อนุมัติ"}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {/* ข้อมูลนักศึกษาและงวด */}
                  <section className={styles.loanApprovalInfoCard}>
                    <CardHeader
                      className={styles.sectionCardHeading}
                      icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
                      title="ข้อมูลนักศึกษา"
                    />
                    <dl>
                      <div>
                        <dt>ชื่อ-นามสกุล</dt>
                        <dd>{selectedRequest.name}</dd>
                      </div>
                      <div>
                        <dt>รหัสนักศึกษา</dt>
                        <dd>{selectedRequest.studentId}</dd>
                      </div>
                      <div>
                        <dt>งวดที่ชำระ</dt>
                        <dd>
                          งวดที่ {selectedEvidence.installmentNumber} จาก {selectedRequest.term} งวด
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer ตรวจสอบสลิป */}
            {selectedEvidence.status === "pending" ? (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shrink-0">
                {!slipConfirmAction ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => setSlipConfirmAction("reject")}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98] cursor-pointer"
                      type="button"
                    >
                      ปฏิเสธสลิป
                    </button>
                    <button
                      onClick={() => setSlipConfirmAction("approve")}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all active:scale-[0.98] cursor-pointer"
                      type="button"
                    >
                      อนุมัติสลิป ถูกต้อง
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                    <h4
                      className={`font-bold text-[14px] mb-2 flex items-center gap-2 ${
                        slipConfirmAction === "approve" ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {slipConfirmAction === "approve"
                        ? "ยืนยันการอนุมัติสลิป"
                        : "เหตุผลที่ปฏิเสธสลิป"}
                    </h4>
                    {slipConfirmAction === "reject" && (
                      <textarea
                        className="w-full border border-gray-300 rounded-xl p-3 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                        placeholder="ระบุเหตุผล เช่น ยอดเงินไม่ตรงกับยอดที่เรียกเก็บ, รูปภาพไม่ชัดเจน..."
                        rows={3}
                        value={slipRemark}
                        onChange={(e) => setSlipRemark(e.target.value)}
                      />
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSlipConfirmAction(null)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer"
                        type="button"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={closeEvidenceModal}
                        className={`px-5 py-2 text-white font-bold rounded-xl text-[13px] shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                          slipConfirmAction === "approve"
                            ? "bg-[#059669] hover:bg-[#047857]"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                        type="button"
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex shrink-0">
                <button
                  onClick={closeEvidenceModal}
                  className="w-full py-3 flex items-center justify-center rounded-xl text-[14px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                  type="button"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
