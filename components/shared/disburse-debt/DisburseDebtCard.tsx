// src/components/superadmin/setting/DisburseDebtCard.tsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TablePagination from "@/components/shared/TablePagination";
import {
  X,
  UserRound,
  Landmark,
  HandCoins,
  CalendarDays,
  CreditCard,
  Check,
  CheckCircle2,
  Copy,
  UploadCloud,
  FileImage,
  AlertCircle,
  Loader2,
  XCircle,
  SearchX,
  FileText,
  Download,
  ZoomIn,
  RefreshCw,
} from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import AdaptiveKeyValueRow from "@/components/shared/AdaptiveKeyValueRow";
import ImageWithSkeleton from "@/components/shared/ImageWithSkeleton";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import RequestTimeline from "@/components/shared/RequestTimeline";
import styles from "@/app/student/student.module.css";
import LoanPetitionDocument, { downloadLoanPetitionPdf } from "./LoanPetitionDocument";
import { withBasePath } from "@/lib/base-path";

// ==========================================
// การกำหนด Type
// ==========================================
export type StudentInfo = {
  name: string;
  nameEn?: string;
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
  approvedAmount?: number | null;
  term: string;
  expectedReturnDate?: string;
  bankDetails?: BankDetails;
  additionalNote?: string;
};

export type RequestStatus = {
  submitDate: string;
  submitTime?: string;
  waitDays?: number;
  isOverdue?: boolean;
  history?: ActionHistory[];
};

export type ActionHistory = {
  action: string;
  date: string;
  actor: string;
  commentTitle?: string;
  comment?: string;
  isCompleted?: boolean;
  isPending?: boolean;
  isUpcoming?: boolean;
  isFailed?: boolean;
  isRevision?: boolean;
  transferDetails?: string[];
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
  paidAt?: string;
  slipUrl?: string;
};

export type InstallmentRecord = {
  installmentNumber: number;
  dueDate?: string;
  amount: number | string;
  paidAmount?: number | string;
  isPaid?: boolean;
  paidDate?: string;
};

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    requestStatus: string;
    paymentBehavior?: PaymentBehaviorInfo;
    approvals?: ApprovalStep[];
    paymentHistory?: PaymentHistoryRecord[];
    installments?: InstallmentRecord[];
    slipUrl?: string; // รองรับการแสดงรูปสลิป
    documentUrl?: string; // รองรับการแสดงไฟล์เอกสาร
  };

interface DisburseDebtCardProps {
  // EXPERIMENT disburse-debt-paging (revert: EXPERIMENT-disburse-debt-paging.local.md): when set,
  // `requests` is already the current page and the pager is driven by the parent.
  serverPaging?: { page: number; total: number; pageSize: number; onPageChange: (page: number) => void };
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

const formatStudentDetails = (request: StudentInfo) =>
  [request.studentId, request.major, request.degree, `ปี ${request.year}`]
    .filter(Boolean)
    .join(" • ");

function calculateInstallments(
  startDateStr: string,
  termStr: string,
  amountStr: string,
  paymentHistory?: PaymentHistoryRecord[],
) {
  const termsCount = parseInt(termStr, 10) || 0;
  const totalAmount = parseFloat(String(amountStr).replace(/,/g, "")) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const baseAmount = Math.floor(totalAmount / termsCount);
  const schedule = Array.from({ length: termsCount }, (_, i) => {
    const isLast = i === termsCount - 1;
    const initialExpected = isLast ? totalAmount - baseAmount * (termsCount - 1) : baseAmount;
    return {
      installmentNumber: i + 1,
      expectedAmount: initialExpected,
      baseAmount: initialExpected,
      isPaid: false,
      paidAmount: 0,
    };
  });

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
        if (s.paidAmount > s.baseAmount) {
          totalExcess += s.paidAmount - s.baseAmount;
          s.expectedAmount = s.paidAmount;
        } else if (s.paidAmount < s.baseAmount) {
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
export default function DisburseDebtCard({ requests, serverPaging }: DisburseDebtCardProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [prevRequests, setPrevRequests] = useState(requests);

  if (prevRequests !== requests) {
    setPrevRequests(requests);
    setCurrentPage(1);
  }

  const totalPages = serverPaging
    ? Math.ceil(serverPaging.total / serverPaging.pageSize)
    : Math.ceil(requests.length / 5);
  const validCurrentPage = serverPaging
    ? serverPaging.page
    : totalPages > 0
      ? Math.min(Math.max(currentPage, 1), totalPages)
      : 1;
  const paginatedRequests = serverPaging || requests.length <= 5
    ? requests
    : requests.slice((validCurrentPage - 1) * 5, validCurrentPage * 5);

  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);

  const [viewDocumentReq, setViewDocumentReq] = useState<ActionRequest | null>(null);
  const [documentViewTab, setDocumentViewTab] = useState<"official" | "attachment">("official");

  // State สำหรับอัปโหลดสลิป & คัดลอกเลขบัญชี
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // State สำหรับพรีวิวสลิปขนาดเต็ม
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCompleted =
    selectedRequest?.requestStatus === "disbursed" ||
    selectedRequest?.requestStatus === "closed" ||
    Boolean(selectedRequest?.slipUrl) ||
    Boolean(
      selectedRequest?.history?.some(
        (h) => h.action.includes("โอนเงิน") || h.action.includes("เบิกจ่าย"),
      ),
    );

  const closeAllModals = () => {
    setSelectedRequest(null);
    if (uploadedSlip) URL.revokeObjectURL(uploadedSlip);
    setUploadedSlip(null);
    setSlipFile(null);
    setIsCopied(false);
    setErrorMessage(null);
    setPreviewSlipUrl(null);
  };

  const backdropDismiss = useModalDismiss({
    onClose: closeAllModals,
    isOpen: Boolean(selectedRequest) && !previewSlipUrl && !viewDocumentReq,
  });

  const documentModalDismiss = useModalDismiss({
    onClose: () => setViewDocumentReq(null),
    isOpen: Boolean(viewDocumentReq),
  });

  const slipPreviewModalDismiss = useModalDismiss({
    onClose: () => setPreviewSlipUrl(null),
    isOpen: Boolean(previewSlipUrl),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedSlip) {
        if (previewSlipUrl === uploadedSlip) setPreviewSlipUrl(null);
        URL.revokeObjectURL(uploadedSlip);
      }
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

      const res = await fetch(withBasePath(`/api/admin/loan-requests/${selectedRequest.id}/disburse`), {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = data?.error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
        if (res.status === 401) msg = "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
        else if (res.status === 403) msg = "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
        else if (res.status === 404) msg = "ไม่พบข้อมูลคำร้องนี้ในระบบ";
        else if (res.status === 409)
          msg = data?.error?.message || "คำร้องนี้ถูกดำเนินการไปแล้ว หรือเกิดข้อขัดแย้ง";
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
          paginatedRequests.map((req, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-semibold text-gray-900 text-[15px] leading-tight">
                    {req.name}
                  </div>
                  <div className="text-[14px] leading-5 text-gray-500 mt-1">
                    {formatStudentDetails(req)}
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
                    <div className="text-[11px] text-gray-500 mb-0.5">จำนวนที่อนุมัติ</div>
                    <div className="font-semibold text-[#ea580c]">{formatAmount(req.approvedAmount ?? req.amount)}</div>
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 text-[13px] font-semibold text-green-700 shadow-sm cursor-pointer"
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
        <table className="w-full table-auto text-left border-collapse min-w-[1050px] max-[1299px]:min-w-[1300px] bg-white">
          <colgroup>
            <col className="w-[140px]" />
            <col className="w-[25%]" />
            <col className="w-[130px]" />
            <col className="w-[25%]" />
            <col className="w-[100px]" />
            <col className="w-[100px]" />
            <col className="w-px" />
          </colgroup>
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="min-w-[140px] py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                <span className="lg:hidden">
                  รหัส
                  <br />
                  คำร้อง
                </span>
                <span className="hidden lg:inline">รหัสคำร้อง</span>
              </th>
              <th className="w-[25%] py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                วันที่-เวลายื่นคำร้อง
              </th>
              <th className="w-[25%] py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                วัตถุประสงค์การกู้ยืม
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนเงิน
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนงวด
              </th>
              <th className="w-px py-3.5 px-4 text-center font-semibold whitespace-nowrap">จัดการ</th>
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
              paginatedRequests.map((req, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
                >
                  <td className="w-[140px] min-w-[140px] py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <span>{req.id}</span>
                    </div>
                  </td>
                  <td className="w-[25%] py-4 px-4 border-r border-gray-200">
                    <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                      <span>{req.name}</span>
                    </div>
                    <div className="mt-0.5 text-[14px] leading-5 text-gray-500">
                      {formatStudentDetails(req)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    <div className="flex flex-col items-center leading-relaxed">
                      <span>{req.submitDate}</span>
                      {getSubmittedTime(req) && <span>{getSubmittedTime(req)}</span>}
                    </div>
                  </td>
                  <td className="w-[25%] py-4 px-4 text-left font-normal text-gray-700 border-r border-gray-200">
                    <div className="line-clamp-2">{req.objective}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-900 border-r border-gray-200 whitespace-nowrap">
                    {formatAmount(req.approvedAmount ?? req.amount)}
                  </td>
                  <td className="py-4 px-4 text-center font-normal text-gray-700 border-r border-gray-200 whitespace-nowrap">
                    {req.term} งวด
                  </td>
                  <td className="w-px py-4 px-4 align-middle whitespace-nowrap">
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
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors px-2.5 py-1.5 text-[12px] font-semibold text-green-700 shadow-sm cursor-pointer"
                          title="ดูหลักฐานการโอน"
                        >
                          <CheckCircle2 size={14} className="shrink-0" /> ดูหลักฐาน
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

      {(serverPaging ? totalPages > 1 : requests.length > 5) && (
        <TablePagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          onPageChange={serverPaging ? serverPaging.onPageChange : setCurrentPage}
        />
      )}

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
              <div className="flex gap-2 pr-2">
                <span className="flex self-stretch items-center rounded-xl bg-orange-100 px-2 text-[#ea580c]">
                  <HandCoins aria-hidden="true" size={24} />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                    {isCompleted ? "หลักฐานการเบิกจ่ายเงิน" : "ดำเนินการเบิกจ่ายเงิน"}
                  </h2>
                  <p className="mt-0.5 text-[14px] text-gray-500">
                    อ้างอิงคำร้อง: {selectedRequest.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${
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
                    <dt>ระดับการศึกษา</dt>
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

              {/* ข้อมูลบัญชีธนาคารสำหรับรับเงิน */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ข้อมูลบัญชีธนาคารสำหรับรับเงิน"
                />
                <dl>
                  <div>
                    <dt>ธนาคาร</dt>
                    <dd>{selectedRequest.bankDetails?.bankName || "-"}</dd>
                  </div>
                  <div>
                    <dt>เลขที่บัญชี</dt>
                    <dd className="flex items-center justify-end gap-2">
                      <span className="font-[family-name:var(--font-kanit)] text-[15px] font-semibold text-gray-900">
                        {selectedRequest.bankDetails?.accountNumber || "-"}
                      </span>
                      {selectedRequest.bankDetails?.accountNumber && (
                        <button
                          onClick={() =>
                            handleCopy(selectedRequest.bankDetails?.accountNumber ?? "")
                          }
                          aria-label={isCopied ? "คัดลอกเลขที่บัญชีแล้ว" : "คัดลอกเลขที่บัญชี"}
                          className={`inline-flex p-1 transition-colors cursor-pointer ${
                            isCopied
                              ? "text-gray-600"
                              : "text-gray-400 hover:text-gray-700"
                          }`}
                          title={isCopied ? "คัดลอกเลขที่บัญชีแล้ว" : "คัดลอกเลขที่บัญชี"}
                          type="button"
                        >
                          {isCopied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
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
                  <AdaptiveKeyValueRow
                    label="วัตถุประสงค์การกู้ยืม"
                    value={selectedRequest.objective || "-"}
                  />
                  <div>
                    <dt>ยื่นเมื่อ</dt>
                    <dd>
                      {selectedRequest.submitTime
                        ? `${selectedRequest.submitDate} ${selectedRequest.submitTime}`
                        : selectedRequest.submitDate}
                    </dd>
                  </div>
                  <div className={styles.loanAmountRow}>
                    <dt>
                      {isCompleted ? "ยอดเงินที่โอนแล้ว (บาท)" : "จำนวนเงินที่อนุมัติ (บาท)"}
                    </dt>
                    <dd
                      className={`font-[family-name:var(--font-kanit)] font-semibold ${
                        isCompleted ? "text-green-600" : "text-[#ea580c]"
                      }`}
                    >
                      {formatAmount(selectedRequest.approvedAmount ?? selectedRequest.amount)}
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
                    String(selectedRequest.approvedAmount ?? selectedRequest.amount),
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
                              {formatAmount(inst.paidAmount)}
                            </strong>
                          </>
                        ) : (
                          <strong
                            className={
                              inst.expectedAmount === 0 ? "text-gray-400" : "text-[#ea580c]"
                            }
                          >
                            {formatAmount(inst.expectedAmount)}
                          </strong>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* สลิปหลักฐานการโอนเงิน / แนบสลิป */}
              <section className={styles.loanApprovalInfoCard}>
                <div className="flex items-center justify-between">
                  <CardHeader
                    className={styles.sectionCardHeading}
                    icon={<FileImage aria-hidden="true" size={20} strokeWidth={2.2} />}
                    title={isCompleted ? "สลิปหลักฐานการโอนเงิน" : "แนบสลิปหลักฐานการโอนเงิน"}
                  />
                </div>

                {isCompleted ? (
                  selectedRequest.slipUrl ? (
                    <div className="mt-2 space-y-3">
                      <div
                        onClick={() => setPreviewSlipUrl(selectedRequest.slipUrl || null)}
                        className="group relative flex cursor-pointer justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-2"
                        title="คลิกเพื่อดูภาพขนาดเต็ม (Preview)"
                      >
                        <ImageWithSkeleton
                          src={selectedRequest.slipUrl}
                          alt="slip proof"
                          containerClassName="max-h-[45vh] max-w-full flex items-center justify-center"
                          className="max-h-[45vh] w-auto max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:text-sm rounded-xl">
                          <ZoomIn size={22} className="drop-shadow" />
                          <span className="drop-shadow">คลิกเพื่อดูภาพขนาดเต็ม</span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setPreviewSlipUrl(selectedRequest.slipUrl || null)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
                        >
                          <ZoomIn size={16} className="text-gray-500" />
                          <span>ดูรูปแบบเต็ม</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <FileImage size={36} className="mb-2 opacity-50" />
                      <p className="text-sm">ไม่พบรูปภาพหลักฐานการโอนเงิน</p>
                    </div>
                  )
                ) : (
                  <div className="mt-2 space-y-3">
                    {uploadedSlip ? (
                      <div className="space-y-3">
                        <div
                          onClick={() => setPreviewSlipUrl(uploadedSlip)}
                          className="group relative flex cursor-pointer justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-2"
                          title="คลิกเพื่อดูภาพขนาดเต็ม (Preview)"
                        >
                          <ImageWithSkeleton
                            src={uploadedSlip}
                            alt="ตัวอย่างหลักฐานการโอนเงิน"
                            containerClassName="max-h-[40vh] max-w-full flex items-center justify-center"
                            className="max-h-[40vh] w-auto max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:text-sm rounded-xl">
                            <ZoomIn size={22} className="drop-shadow" />
                            <span className="drop-shadow">คลิกเพื่อดูภาพขนาดเต็ม</span>
                          </div>
                        </div>

                        {slipFile?.name && (
                          <p className="text-center text-xs text-gray-500 break-all px-2">
                            {slipFile.name}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPreviewSlipUrl(uploadedSlip)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
                          >
                            <ZoomIn size={16} className="text-gray-500" />
                            <span>ดูรูปแบบเต็ม</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-[#ea580c] bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:text-[#c2410c] transition-colors shadow-sm cursor-pointer"
                          >
                            <RefreshCw size={15} />
                            <span>เปลี่ยนรูปภาพ</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`group rounded-xl border-2 border-dashed text-center transition-colors ${
                          errorMessage
                            ? "border-red-400 bg-red-50 hover:border-orange-300 hover:bg-orange-50 active:border-orange-400 active:bg-orange-100"
                            : "border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 active:border-orange-400 active:bg-orange-100"
                        }`}
                      >
                        <button
                          className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center p-5"
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                        >
                          <UploadCloud
                            aria-hidden="true"
                            className="text-gray-400 transition-colors group-hover:text-orange-300 group-active:text-orange-400"
                            size={32}
                          />
                          <span className="mt-2 text-sm font-normal text-gray-800">
                            แตะเพื่ออัปโหลดหลักฐานการโอน
                          </span>
                          <span className="mt-1 max-w-full break-all text-sm font-normal text-gray-500">
                            รองรับ JPG หรือ PNG (ขนาดไม่เกิน 1MB)
                          </span>
                        </button>
                      </div>
                    )}

                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                    />

                    <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[14px] text-amber-700">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>
                        โปรดตรวจสอบชื่อบัญชีและเลขที่บัญชีให้ตรงกับข้อมูลนักศึกษาก่อนกดยืนยันการโอนเงิน
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* พฤติกรรมการชำระเงิน */}
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
                      พฤติกรรมการชำระเงิน
                    </h3>
                  </header>
                  {(selectedRequest.paymentBehavior?.totalInstallments ?? 0) > 0 && (
                    <span
                      className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
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
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="text-[14px] text-gray-500">ประวัติกู้ยืม</div>
                    <div className="mt-0.5 text-[14px] font-semibold text-gray-900">
                      {selectedRequest.paymentBehavior?.totalLoanRequests ?? 0} ครั้ง
                    </div>
                  </div>
                  <div
                    className={
                      (selectedRequest.paymentBehavior?.totalInstallments ?? 0) > 0 &&
                      (selectedRequest.paymentBehavior?.onTimeInstallments ?? 0) > 0
                        ? "bg-emerald-50/60 p-3 rounded-xl border border-emerald-100"
                        : "bg-gray-50 p-3 rounded-xl border border-gray-100"
                    }
                  >
                    <div
                      className={
                        (selectedRequest.paymentBehavior?.totalInstallments ?? 0) > 0 &&
                        (selectedRequest.paymentBehavior?.onTimeInstallments ?? 0) > 0
                          ? "text-[14px] font-medium text-emerald-700"
                          : "text-[14px] text-gray-500"
                      }
                    >
                      ตรงเวลา
                    </div>
                    <div
                      className={
                        (selectedRequest.paymentBehavior?.totalInstallments ?? 0) > 0 &&
                        (selectedRequest.paymentBehavior?.onTimeInstallments ?? 0) > 0
                          ? "mt-0.5 text-[14px] font-semibold text-emerald-800"
                          : "mt-0.5 text-[14px] font-semibold text-gray-900"
                      }
                    >
                      {selectedRequest.paymentBehavior?.onTimeInstallments ?? 0} งวด
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="text-[14px] text-gray-500">ล่าช้า</div>
                    <div className="mt-0.5 text-[14px] font-semibold text-gray-900">
                      {selectedRequest.paymentBehavior?.lateInstallments ?? 0} งวด
                    </div>
                  </div>
                </div>
              </section>

              {/* ติดตามสถานะคำร้อง */}
              <RequestTimeline
                history={selectedRequest.history}
                approvals={selectedRequest.approvals}
                requestStatus={selectedRequest.requestStatus}
                advisorName={selectedRequest.advisorName}
                studentName={selectedRequest.name}
                submitDate={selectedRequest.submitDate}
                hideBankDetails
              />

              {/* ปุ่มดาวน์โหลดแบบคำร้อง (PDF) เหมือนหน้านักศึกษา - แสดงเฉพาะเมื่อ admin/super admin โอนเงินสำเร็จแล้ว */}
              {isCompleted && (
                <button
                  className={styles.loanDownloadButton}
                  type="button"
                  onClick={() => {
                    setDocumentViewTab("official");
                    setViewDocumentReq(selectedRequest);
                  }}
                >
                  <Download aria-hidden="true" size={18} />
                  <strong>ดาวน์โหลดแบบคำร้อง (PDF)</strong>
                </button>
              )}
            </div>

            {/* Footer Buttons */}
            {!isCompleted && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex gap-3 shrink-0">
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
                      className="flex-1 py-3 flex items-center justify-center text-[14px] font-bold text-red-600 bg-white border-2 border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      ยกเลิกคำร้อง
                    </button>
                    <button
                      disabled={!uploadedSlip || isSubmitting}
                      onClick={handleDisburse}
                      type="button"
                      className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white transition-all shadow-sm disabled:cursor-not-allowed ${
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
                        <>ยืนยันการโอนเงิน</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewDocumentReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm print:p-0 print:bg-white"
          {...documentModalDismiss}
          role="presentation"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[88vh] sm:h-[92vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200 print:h-auto print:max-w-full print:border-none print:shadow-none">
            {/* Header ของ Modal เอกสาร */}
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-[#ea580c] p-2 rounded-lg">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                    แบบขอยืมเงินทุนสวัสดิการ
                  </h2>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    รหัสคำร้อง: {viewDocumentReq.id} • {viewDocumentReq.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* แถบเลือกสลับระหว่างแบบฟอร์มทางการ และไฟล์แนบ (หากมี) */}
                {viewDocumentReq.documentUrl && (
                  <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDocumentViewTab("official")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        documentViewTab === "official"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      แบบฟอร์มทางการ
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocumentViewTab("attachment")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        documentViewTab === "attachment"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      ไฟล์แนบต้นฉบับ
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setViewDocumentReq(null)}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ส่วนแสดงเนื้อหาเอกสาร */}
            <div className="flex-1 bg-gray-100/90 p-4 sm:p-6 overflow-y-auto print:bg-white print:p-0">
              {viewDocumentReq.documentUrl && documentViewTab === "attachment" ? (
                <iframe
                  src={viewDocumentReq.documentUrl}
                  className="w-full h-full min-h-[500px] rounded-xl border border-gray-300 shadow-sm bg-white"
                  title="Petition Document"
                />
              ) : (
                <LoanPetitionDocument request={viewDocumentReq} userRole="admin" />
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 print:hidden">
              <span className="text-[11px] sm:text-xs text-gray-500 hidden sm:inline">
                แบบฟอร์มทางการกองทุนสวัสดิการนักศึกษา คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() =>
                    downloadLoanPetitionPdf(viewDocumentReq, documentViewTab === "attachment")
                  }
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Download size={15} />
                  <span>ดาวน์โหลด PDF</span>
                </button>
                <button
                  onClick={() => setViewDocumentReq(null)}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer text-center active:scale-[0.98]"
                  type="button"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal พรีวิวสลิปหลักฐานการโอนเงิน (Image Preview Lightbox) */}
      {previewSlipUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200"
          {...slipPreviewModalDismiss}
          role="presentation"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header ของ Modal พรีวิวสลิป */}
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                  <FileImage size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    สลิปหลักฐานการโอนเงิน
                  </h3>
                  {selectedRequest && (
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      คำร้อง: {selectedRequest.id} • {selectedRequest.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setPreviewSlipUrl(null)}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="ปิดหน้าต่างพรีวิว"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ส่วนแสดงภาพสลิป */}
            <div className="p-4 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-gray-100/70 min-h-[300px]">
              {previewSlipUrl.toLowerCase().includes(".pdf") ||
              previewSlipUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewSlipUrl}
                  className="w-full h-[70vh] rounded-xl border border-gray-300 shadow-sm bg-white"
                  title="สลิปหลักฐานการโอนเงิน"
                />
              ) : (
                <ImageWithSkeleton
                  src={previewSlipUrl}
                  alt="สลิปหลักฐานการโอนเงินขนาดเต็ม"
                  containerClassName="max-h-[72vh] max-w-full"
                  className="max-h-[72vh] w-auto max-w-full rounded-xl shadow-md object-contain select-none bg-white"
                />
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
