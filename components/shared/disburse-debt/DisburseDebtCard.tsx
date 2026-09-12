// src/components/superadmin/setting/DisburseDebtCard.tsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Copy,
  UploadCloud,
  FileImage,
  AlertCircle,
  Loader2,
  XCircle,
  SearchX,
} from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import styles from "@/app/student/student.module.css";

// ==========================================
// การกำหนด Type
// ==========================================
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

export type ApprovalStep = {
  step: "advisor" | "admin" | "executive";
  actorName: string;
  comment: string;
  decision: "approved" | "rejected" | "returned" | "pending";
  date: string;
};

export type PaymentHistoryRecord = {
  id?: string;
  status?: string;
  installmentNumber: number;
  amount: number | string;
  dueDate?: string;
  paidDate?: string;
  slipUrl?: string;
};

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    requestStatus: string;
    paymentBehavior?: PaymentBehaviorInfo;
    approvals?: ApprovalStep[];
    paymentHistory?: PaymentHistoryRecord[];
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
  paymentHistory?: PaymentHistoryRecord[],
) {
  const termsCount = parseInt(termStr, 10) || 0;
  const totalAmount = parseFloat(amountStr) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const baseAmount = totalAmount / termsCount;
  const schedule = Array.from({ length: termsCount }, (_, i) => ({
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
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);

  // State สำหรับอัปโหลดสลิป & คัดลอกเลขบัญชี
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRequestHistory = selectedRequest?.history ?? [];
  const isCompleted =
    selectedRequest?.requestStatus === "disbursed" || selectedRequest?.requestStatus === "closed";

  const closeAllModals = () => {
    setSelectedRequest(null);
    if (uploadedSlip) URL.revokeObjectURL(uploadedSlip);
    setUploadedSlip(null);
    setSlipFile(null);
    setIsCopied(false);
    setErrorMessage(null);
  };

  const backdropDismiss = useModalDismiss({
    onClose: closeAllModals,
    isOpen: Boolean(selectedRequest),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedSlip) URL.revokeObjectURL(uploadedSlip);
      const imageUrl = URL.createObjectURL(file);
      setUploadedSlip(imageUrl);
      setSlipFile(file);
      setErrorMessage(null);
    }
  };

  const handleDisburse = async () => {
    if (isSubmitting) return;
    if (!selectedRequest || !slipFile) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("slip", slipFile);

      const res = await fetch(`/api/admin/loan-requests/${selectedRequest.id}/disburse`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = data?.error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
        if (res.status === 401) msg = "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
        else if (res.status === 403) msg = "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
        else if (res.status === 404) msg = "ไม่พบข้อมูลคำร้องนี้ในระบบ";
        else if (res.status === 409) msg = data?.error?.message || "คำร้องนี้ถูกดำเนินการไปแล้ว หรือเกิดข้อขัดแย้ง";
        else if (res.status === 422) msg = data?.error?.message || "ไฟล์สลิปไม่ถูกต้อง";
        throw new Error(msg);
      }

      closeAllModals();
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
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
                  {req.submitDate}
                </span>
              </div>

              <div className="text-[13px] text-gray-700 bg-orange-50/40 p-3 rounded-xl border border-orange-100/60 line-clamp-2">
                <span className="font-semibold text-gray-900">นำไปใช้: </span>
                {req.objective}
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
                <div className="flex gap-4">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">จำนวนที่ขอ</div>
                    <div className="font-bold text-[#ea580c]">฿{formatAmount(req.amount)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">จำนวนงวด</div>
                    <div className="font-medium text-gray-700 text-[14px]">{req.term} งวด</div>
                  </div>
                </div>

                {req.requestStatus !== "disbursed" && req.requestStatus !== "closed" ? (
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="w-fit max-w-full px-4 py-2 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer"
                  >
                    ดำเนินการ
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm cursor-pointer"
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
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 min-w-[200px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                วันที่-เวลายื่นคำร้อง
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 min-w-[200px]">
                รายละเอียดเพื่อนำไปใช้
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนเงิน
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนงวด
              </th>
              <th className="py-3.5 px-4 text-center font-bold whitespace-nowrap">จัดการ</th>
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
                    <div className="flex flex-col items-center leading-relaxed">
                      <span>{req.submitDate}</span>
                      {getSubmittedTime(req) && <span>{getSubmittedTime(req)}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-left font-normal text-gray-700 border-r border-gray-200">
                    <div className="line-clamp-2">{req.objective}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-900 border-r border-gray-200 whitespace-nowrap">
                    {formatAmount(req.amount)}
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-700 border-r border-gray-200 whitespace-nowrap">
                    {req.term} งวด
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex justify-center">
                      {req.requestStatus !== "disbursed" && req.requestStatus !== "closed" ? (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="w-fit max-w-full px-3 py-1.5 text-[13px] rounded-lg transition-colors border text-center text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer"
                        >
                          <span className="block truncate">ดำเนินการ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm cursor-pointer"
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
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          {...backdropDismiss}
          role="presentation"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-5 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="pr-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {isCompleted ? "หลักฐานการเบิกจ่ายเงิน" : "ดำเนินการเบิกจ่ายเงิน"}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  อ้างอิงคำร้อง: {selectedRequest.id}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={`text-[12px] font-bold px-3 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-orange-50 text-[#ea580c] border-orange-200"
                  }`}
                >
                  ● {isCompleted ? "โอนเงินแล้ว" : "รอเบิกจ่าย"}
                </span>
                <button
                  onClick={closeAllModals}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {!isCompleted && (
                <div className={styles.loanApprovalWarning}>
                  กรุณาตรวจสอบข้อมูลทางการเงินและเลขที่บัญชีให้ถูกต้องก่อนกดยืนยันการโอนเงิน
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
                <dl>
                  <div>
                    <dt>ธนาคาร</dt>
                    <dd>{selectedRequest.bankDetails?.bankName || "-"}</dd>
                  </div>
                  <div>
                    <dt>เลขที่บัญชี</dt>
                    <dd className="flex items-center justify-end gap-2">
                      <span className="font-mono font-bold text-gray-900 text-[15px]">
                        {selectedRequest.bankDetails?.accountNumber || "-"}
                      </span>
                      {selectedRequest.bankDetails?.accountNumber && (
                        <button
                          onClick={() =>
                            handleCopy(selectedRequest.bankDetails?.accountNumber ?? "")
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            isCopied
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-50 text-[#ea580c] hover:bg-orange-100 border border-orange-200"
                          }`}
                          type="button"
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle2 size={13} /> คัดลอกแล้ว
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> คัดลอก
                            </>
                          )}
                        </button>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>ชื่อบัญชี</dt>
                    <dd>{selectedRequest.bankDetails?.accountName || "-"}</dd>
                  </div>
                </dl>
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
                    <dt>{isCompleted ? "ยอดเงินที่โอนแล้ว (บาท)" : "จำนวนเงินที่ขอกู้ยืม (บาท)"}</dt>
                    <dd
                      className={`font-bold ${
                        isCompleted ? "text-green-600" : "text-[#ea580c]"
                      }`}
                    >
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

              {/* กำหนดการผ่อนชำระ */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<CalendarDays aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title={`กำหนดการผ่อนชำระ (${selectedRequest.term} งวด)`}
                />
                <div className={styles.loanScheduleList}>
                  {calculateInstallments(
                    selectedRequest.submitDate,
                    selectedRequest.term,
                    selectedRequest.amount,
                    selectedRequest.paymentHistory,
                  ).map((inst) => (
                    <div className={styles.loanScheduleRow} key={inst.installmentNumber}>
                      <strong className="flex items-center gap-1">
                        งวด {inst.installmentNumber}
                        {inst.isPaid && (
                          <CheckCircle2 size={14} className="text-green-600 inline ml-1" />
                        )}
                      </strong>
                      <span>{inst.dateString}</span>
                      <div className="flex items-center gap-1.5 justify-end">
                        {inst.isPaid ? (
                          <>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ชำระแล้ว
                            </span>
                            <strong className="text-emerald-700">
                              ฿{formatAmount(inst.paidAmount)}
                            </strong>
                          </>
                        ) : (
                          <strong
                            className={
                              inst.expectedAmount === 0 ? "text-gray-400" : "text-[#ea580c]"
                            }
                          >
                            ฿{formatAmount(inst.expectedAmount)}
                          </strong>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* สลิปหลักฐานการโอนเงิน / แนบสลิป */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<FileImage aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title={isCompleted ? "สลิปหลักฐานการโอนเงิน" : "แนบสลิปหลักฐานการโอนเงิน"}
                />

                {isCompleted ? (
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-3 flex justify-center items-center min-h-[180px] mt-2">
                    {selectedRequest.slipUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedRequest.slipUrl}
                        alt="slip proof"
                        className="max-h-[45vh] rounded-lg shadow-sm object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                        <FileImage size={36} className="mb-2 opacity-50" />
                        <p className="text-sm">ไม่พบรูปภาพหลักฐานการโอนเงิน</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    {uploadedSlip ? (
                      <div className="relative rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 p-2 flex justify-center items-center h-48 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadedSlip}
                          alt="slip preview"
                          className="max-h-full rounded-lg shadow-sm object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => {
                              if (uploadedSlip) URL.revokeObjectURL(uploadedSlip);
                              setUploadedSlip(null);
                            }}
                            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-50 transition-colors cursor-pointer"
                            type="button"
                          >
                            เปลี่ยนรูปภาพ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-orange-50/40 hover:border-orange-300 transition-colors p-6 flex flex-col justify-center items-center h-44 cursor-pointer"
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
                    <div className="flex gap-2 text-[12px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>
                        โปรดตรวจสอบชื่อบัญชีและเลขที่บัญชีให้ตรงกับข้อมูลนักศึกษาก่อนกดยืนยันการโอนเงินทุกครั้ง
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* ความเห็นประกอบการพิจารณา */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<MessageSquare aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ความเห็นประกอบการพิจารณา"
                />
                {selectedRequest.approvals && selectedRequest.approvals.length > 0 ? (
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
                ) : (
                  <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mt-2">
                    <p className="text-[13px] text-gray-500">ยังไม่มีความเห็นประกอบการพิจารณา</p>
                  </div>
                )}
              </section>

              {/* ประวัติการชำระคืนกองทุน */}
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

              {/* ประวัติการดำเนินการ */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<History aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ประวัติการดำเนินการ"
                />
                {selectedRequestHistory.length > 0 ? (
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
                ) : (
                  <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mt-2">
                    <p className="text-[13px] text-gray-500">ยังไม่มีประวัติการดำเนินการ</p>
                  </div>
                )}
              </section>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex gap-3 shrink-0">
              {isCompleted ? (
                <button
                  onClick={closeAllModals}
                  className="w-full py-3 flex items-center justify-center rounded-xl text-[14px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                  type="button"
                >
                  ปิดหน้าต่าง
                </button>
              ) : (
                <div className="w-full space-y-3">
                  {errorMessage && (
                    <div className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                      <XCircle size={14} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={closeAllModals}
                      disabled={isSubmitting}
                      className="flex-1 py-3 text-[14px] font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      ยกเลิก
                    </button>
                    <button
                      disabled={!uploadedSlip || isSubmitting}
                      onClick={handleDisburse}
                      type="button"
                      className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-all shadow-sm disabled:cursor-not-allowed ${
                        uploadedSlip && !isSubmitting
                          ? "bg-[#059669] hover:bg-[#047857] shadow-green-600/20 cursor-pointer active:scale-[0.98]"
                          : "bg-gray-300"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} /> ยืนยันว่าโอนเงินแล้ว
                        </>
                      )}
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
