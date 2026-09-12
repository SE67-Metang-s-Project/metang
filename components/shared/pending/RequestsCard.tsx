// src/components/superadmin/setting/RequestsCard.tsx
"use client";

import React, { useState } from "react";
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
  XCircle,
  ShieldAlert,
  Pencil,
  SearchX,
  Loader2,
} from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import styles from "@/app/student/student.module.css";

// ==========================================
// การกำหนด Type (อ้างอิงจาก Database Schema)
// ==========================================
export type StudentInfo = {
  name: string;
  studentId: string;
  major: string;
  program?: string;
  degree?: string;
  year: string;
  phone?: string;
  advisorName?: string;
  educationLevel?: string;
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
  submitTime?: string;
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

export type PaymentRecord = {
  id?: string;
  status?: string;
  installmentNumber: number;
  amount: number | string;
  paidAt?: string;
  slipImageUrl?: string;
};

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    requestStatus: LoanStatus;
    paymentBehavior?: PaymentBehaviorInfo;
    approvals?: ApprovalStep[];
    paymentHistory?: PaymentRecord[]; // เพิ่มรองรับการเช็คประวัติชำระเงิน
  };

export type UserRole = "advisor" | "executive" | "admin" | "super_admin";

interface RequestsCardProps {
  requests: ActionRequest[];
  userRole?: UserRole;
  tableLayout?: "default" | "executive";
  onRequestDecided?: (requestId: string, decision: string) => void;
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

// ==========================================
// ฟังก์ชันคำนวณงวดการชำระเงิน (คำนวณยอดที่ต้องจ่าย & หักลบกรณีจ่ายเกิน)
// ==========================================
function calculateInstallments(
  startDateStr: string,
  termStr: string,
  amountStr: string,
  paymentHistory?: PaymentRecord[],
) {
  const termsCount = parseInt(termStr, 10) || 0;
  const totalAmount = parseFloat(String(amountStr).replace(/,/g, "")) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const baseAmount = totalAmount / termsCount;

  // 1. สร้างโครงสร้างงวดการชำระเงินเริ่มต้น
  const schedule = Array.from({ length: termsCount }, (_, i) => ({
    installmentNumber: i + 1,
    expectedAmount: baseAmount,
    isPaid: false,
    paidAmount: 0,
  }));

  // 2. ตรวจสอบประวัติการชำระเงิน และคำนวณยอดที่จ่ายเกิน
  if (paymentHistory && Array.isArray(paymentHistory)) {
    // รวมยอดที่จ่ายมาในแต่ละงวด
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
          // หากจ่ายเกิน นำยอดที่เกินไปสะสมไว้หักงวดท้ายสุด
          totalExcess += s.paidAmount - baseAmount;
          s.expectedAmount = s.paidAmount; // อัปเดตยอดของงวดนี้ให้ตรงกับที่จ่ายจริง
        } else if (s.paidAmount < baseAmount) {
          s.expectedAmount = s.paidAmount; // กรณีจ่ายขาด (ถ้ามี)
        }
      }
    });

    // 3. นำยอดที่จ่ายเกิน ไปหักลบกับงวดท้ายสุดขึ้นมาเรื่อยๆ
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

  // 4. คำนวณวันที่ชำระเงิน
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
    return {
      ...s,
      dateString,
    };
  });
}

function EmptyRequestsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="font-medium text-gray-700">ไม่พบข้อมูลที่ค้นหา</p>
      <p className="text-sm text-gray-500">ยังไม่มีข้อมูลในขณะนี้ หรือลองเปลี่ยนคำค้นหาอีกครั้ง</p>
    </div>
  );
}

const getSubmittedTime = (req: ActionRequest) => {
  const submittedAt = req.history?.[0]?.date;
  const time = submittedAt?.match(/\d{1,2}:\d{2}/)?.[0];

  return time ? `${time} น.` : null;
};

const getStatusDisplay = (status: LoanStatus) => {
  switch (status) {
    case "draft":
      return "แบบร่าง";
    case "pending_advisor":
      return "รอพิจารณา";
    case "pending_admin":
      return "รอเจ้าหน้าที่ตรวจสอบ";
    case "pending_executive":
      return "รอผู้บริหารอนุมัติ";
    case "pending_disbursement":
      return "รอเบิกจ่ายเงิน";
    case "disbursed":
      return "โอนเงินแล้ว";
    case "closed":
      return "เสร็จสิ้น";
    case "returned":
      return "ส่งกลับแก้ไข";
    case "rejected":
      return "ไม่อนุมัติ";
    case "cancelled":
      return "ยกเลิกคำร้อง";
    default:
      return status;
  }
};

const getStatusBadgeClass = (status: LoanStatus) => {
  const s = String(status).toLowerCase();
  if (
    s.includes("reject") ||
    s.includes("cancel") ||
    s.includes("return") ||
    s.includes("ไม่อนุมัติ") ||
    s.includes("ยกเลิก") ||
    s.includes("แก้ไข")
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  } else if (s.includes("pending") || s.includes("รอ")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  } else if (
    s.includes("disbursed") ||
    s.includes("closed") ||
    s.includes("อนุมัติแล้ว") ||
    s.includes("เสร็จสิ้น") ||
    s.includes("โอนเงิน")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
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

const checkCanTakeAction = (role: UserRole, status: LoanStatus) => {
  const s = String(status).toLowerCase();
  if (role === "advisor" && (s === "pending_advisor" || s.includes("รอพิจารณา"))) return true;
  if (
    (role === "admin" || role === "super_admin") &&
    (s === "pending_admin" || s.includes("รอเจ้าหน้าที่ตรวจสอบ"))
  )
    return true;
  if (role === "executive" && (s === "pending_executive" || s.includes("รอผู้บริหารอนุมัติ")))
    return true;
  return false;
};

export default function RequestsCard({
  requests,
  userRole = "advisor",
  tableLayout = "executive",
  onRequestDecided,
}: RequestsCardProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "return" | null>(null);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedRequestHistory = selectedRequest?.history ?? [];
  const isExecutiveTable = tableLayout === "executive";

  // State สำหรับการแก้ไขวงเงิน (Admin / Super Admin)
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState("");
  const [originalRequestedAmount, setOriginalRequestedAmount] = useState<number>(0);
  const [amountError, setAmountError] = useState<string | null>(null);

  const canViewSensitiveData = userRole === "admin" || userRole === "super_admin";
  const canEditAmount = userRole === "admin" || userRole === "super_admin";

  const openRequestModal = (req: ActionRequest) => {
    const parsedAmount = parseInt(String(req.amount || "").replace(/,/g, ""), 10) || 0;
    setSelectedRequest(req);
    setOriginalRequestedAmount(parsedAmount);
    setEditAmountValue(String(parsedAmount));
    setIsEditingAmount(false);
    setAmountError(null);
    setConfirmAction(null);
    setRemark("");
    setErrorMessage(null);
  };

  const closeAllModals = () => {
    setSelectedRequest(null);
    setConfirmAction(null);
    setRemark("");
    setErrorMessage(null);
    setIsEditingAmount(false);
    setAmountError(null);
    setOriginalRequestedAmount(0);
  };

  const backdropDismiss = useModalDismiss({
    onClose: closeAllModals,
    isOpen: Boolean(selectedRequest),
  });

  const handleConfirmDecision = async () => {
    if (!selectedRequest || !confirmAction) return;

    if (!remark.trim()) {
      setErrorMessage(
        confirmAction === "approve"
          ? "กรุณาระบุความเห็นประกอบการพิจารณา"
          : confirmAction === "return"
            ? "กรุณาระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข"
            : "กรุณาระบุเหตุผลที่ไม่อนุมัติ",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let endpoint = "";
      if (userRole === "advisor") {
        endpoint = `/api/advisor/loan-requests/${selectedRequest.id}/decision`;
      } else if (userRole === "admin" || userRole === "super_admin") {
        endpoint = `/api/admin/loan-requests/${selectedRequest.id}/decision`;
      } else if (userRole === "executive") {
        endpoint = `/api/executive/loan-requests/${selectedRequest.id}/decision`;
      } else {
        throw new Error("ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้");
      }

      const payload: {
        decision: string;
        comment: string | null;
        approvedAmount?: number | null;
      } = {
        decision:
          confirmAction === "approve"
            ? "approved"
            : confirmAction === "return"
              ? "returned"
              : "rejected",
        comment: remark.trim() || null,
      };

      if ((userRole === "admin" || userRole === "super_admin") && confirmAction === "approve") {
        const currentAmountStr = isEditingAmount ? editAmountValue : selectedRequest.amount;
        const rawAmount = String(currentAmountStr || "")
          .replace(/,/g, "")
          .trim();
        const parsed = parseInt(rawAmount, 10);
        if (isNaN(parsed) || parsed <= 0) {
          setErrorMessage("กรุณาระบุวงเงินที่มากกว่า 0 บาท");
          setIsSubmitting(false);
          return;
        }
        if (originalRequestedAmount > 0 && parsed > originalRequestedAmount) {
          setErrorMessage(
            `ไม่สามารถปรับวงเงินมากกว่าที่ขอได้ (สูงสุด ฿${originalRequestedAmount.toLocaleString("th-TH")})`,
          );
          setIsSubmitting(false);
          return;
        }
        payload.approvedAmount = parsed;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = data?.error?.message || data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
        if (res.status === 401) msg = "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
        else if (res.status === 403) msg = "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
        else if (res.status === 409) msg = data?.error?.message || "คำร้องนี้ได้รับการพิจารณาไปแล้ว หรือเกิดข้อขัดแย้ง";
        else if (res.status === 404) msg = "ไม่พบข้อมูลคำร้องนี้ในระบบ";
        throw new Error(msg);
      }

      const targetId = selectedRequest.id;
      const targetDecision = payload.decision;

      closeAllModals();

      if (onRequestDecided) {
        onRequestDecided(targetId, targetDecision);
      }

      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAmount = () => {
    if (!selectedRequest) return;
    const raw = String(editAmountValue || "").replace(/,/g, "").trim();
    const num = parseInt(raw, 10);

    if (isNaN(num) || num <= 0) {
      setAmountError("กรุณาระบุวงเงินที่มากกว่า 0 บาท");
      return;
    }

    if (originalRequestedAmount > 0 && num > originalRequestedAmount) {
      setAmountError(
        `ไม่สามารถปรับวงเงินมากกว่าที่ขอได้ (สูงสุด ฿${originalRequestedAmount.toLocaleString("th-TH")})`,
      );
      return;
    }

    setAmountError(null);
    setSelectedRequest({ ...selectedRequest, amount: String(num) });
    setEditAmountValue(String(num));
    setIsEditingAmount(false);
  };

  const handleCancelEditAmount = () => {
    setIsEditingAmount(false);
    setEditAmountValue(selectedRequest?.amount || String(originalRequestedAmount));
    setAmountError(null);
  };

  const renderActionButton = (req: ActionRequest, isMobile: boolean) => {
    const textSize = isExecutiveTable ? "text-[14px]" : "text-[13px]";
    const baseClasses = isMobile
      ? `w-fit max-w-full px-4 py-2 ${textSize} rounded-lg transition-colors border text-center`
      : `w-fit max-w-full px-3 py-1.5 ${textSize} rounded-lg transition-colors border text-center`;

    const isActionable = checkCanTakeAction(userRole, req.requestStatus);
    const statusLabel = getStatusDisplay(req.requestStatus);
    const s = String(req.requestStatus).toLowerCase();

    if (isActionable) {
      return (
        <button
          onClick={() => openRequestModal(req)}
          className={`${baseClasses} text-[#ea580c] hover:text-[#c2410c] font-normal bg-orange-50 hover:bg-orange-100 border-orange-200`}
        >
          <span className="block truncate">ตรวจสอบ</span>
        </button>
      );
    }

    let colorClass = "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200";

    if (
      s.includes("reject") ||
      s.includes("cancel") ||
      s.includes("return") ||
      s.includes("ไม่อนุมัติ") ||
      s.includes("ยกเลิก") ||
      s.includes("แก้ไข")
    ) {
      colorClass = "bg-red-50 hover:bg-red-100 text-red-600 border-red-200";
    } else if (s.includes("pending") || s.includes("รอ")) {
      colorClass = "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200";
    } else if (
      s.includes("disbursed") ||
      s.includes("closed") ||
      s.includes("อนุมัติแล้ว") ||
      s.includes("เสร็จสิ้น") ||
      s.includes("โอนเงิน")
    ) {
      colorClass = "bg-green-50 hover:bg-green-100 text-green-600 border-green-200";
    }

    return (
      <button
        onClick={() => openRequestModal(req)}
        className={`${baseClasses} font-normal ${colorClass}`}
      >
        <span className="block truncate">{statusLabel}</span>
      </button>
    );
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
                {renderActionButton(req, true)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full table-fixed text-left border-collapse min-w-[1050px] max-[1299px]:min-w-[1300px] bg-white">
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
              <th className="min-w-[130px] py-3.5 px-4 text-center font-semibold border-r border-gray-300 whitespace-nowrap">
                <span className="lg:hidden">
                  รหัส
                  <br />
                  คำร้อง
                </span>
                <span className="hidden lg:inline">รหัสคำร้อง</span>
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300 min-w-[200px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 text-center font-semibold border-r border-gray-300">
                {isExecutiveTable ? (
                  <>
                    <span className="lg:hidden">
                      วันที่-เวลา
                      <br />
                      ยื่นคำร้อง
                    </span>
                    <span className="hidden lg:inline">วันที่-เวลายื่นคำร้อง</span>
                  </>
                ) : (
                  "วันที่ยื่น"
                )}
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
                  <td className="min-w-[130px] py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
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
                    {isExecutiveTable ? (
                      <div className="flex flex-col items-center leading-relaxed">
                        <span>{req.submitDate}</span>
                        {getSubmittedTime(req) && <span>{getSubmittedTime(req)}</span>}
                      </div>
                    ) : (
                      req.submitDate
                    )}
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
                    <div className="flex justify-center">{renderActionButton(req, false)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Modal หลัก: ตรวจสอบรายละเอียดคำร้อง */}
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
                  คำร้อง {selectedRequest.id}
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  ยื่นเมื่อ {selectedRequest.submitDate}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={`text-[12px] font-bold px-3 py-1 rounded-full border ${getStatusBadgeClass(
                    selectedRequest.requestStatus,
                  )}`}
                >
                  ● {getStatusDisplay(selectedRequest.requestStatus)}
                </span>
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
                    <dd>{selectedRequest.program || "พยาบาลศาสตรบัณฑิต"}</dd>
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
                  <div>
                    <dt>หมายเหตุเพิ่มเติม</dt>
                    <dd>{selectedRequest.additionalNote || "-"}</dd>
                  </div>
                  <div className={styles.loanAmountRow}>
                    <dt className="flex items-center gap-2">
                      <span>จำนวนเงินที่ขอกู้ยืม (บาท)</span>
                      {canEditAmount && !isEditingAmount && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAmountValue(selectedRequest.amount);
                            setAmountError(null);
                            setIsEditingAmount(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors font-normal cursor-pointer"
                        >
                          <Pencil size={12} /> ปรับวงเงิน
                        </button>
                      )}
                    </dt>
                    <dd>
                      {isEditingAmount ? (
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-gray-700">฿</span>
                            <input
                              type="number"
                              min={1}
                              max={originalRequestedAmount || undefined}
                              value={editAmountValue}
                              onChange={(e) => {
                                setEditAmountValue(e.target.value);
                                if (amountError) setAmountError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveAmount();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleCancelEditAmount();
                                }
                              }}
                              className={`w-28 border rounded px-2 py-0.5 text-sm font-bold text-[#ea580c] focus:outline-none text-right ${
                                amountError
                                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-1 focus:ring-[#ea580c]"
                              }`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveAmount}
                              className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200 transition-colors cursor-pointer"
                              title="บันทึก"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditAmount}
                              className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                              title="ยกเลิก"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          {amountError ? (
                            <p className="text-[11px] text-red-500 text-right">{amountError}</p>
                          ) : (
                            <p className="text-[11px] text-gray-400 text-right">
                              (ปรับลดได้สูงสุด ฿{originalRequestedAmount.toLocaleString("th-TH")})
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {originalRequestedAmount > 0 &&
                            Number(selectedRequest.amount) < originalRequestedAmount && (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                ปรับลดจาก ฿{formatAmount(originalRequestedAmount)}
                              </span>
                            )}
                          <span>฿{formatAmount(selectedRequest.amount)}</span>
                        </div>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>จำนวนเงินตัวอักษร</dt>
                    <dd className={styles.loanAmountText}>
                      {formatThaiBahtText(selectedRequest.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt>จำนวนงวดการชำระ</dt>
                    <dd>{selectedRequest.term} งวด</dd>
                  </div>
                </dl>
              </section>

              {/* ตารางการชำระ */}
              <section className={styles.loanApprovalInfoCard}>
                <CardHeader
                  className={styles.sectionCardHeading}
                  icon={<CalendarDays aria-hidden="true" size={20} strokeWidth={2.2} />}
                  title="ตารางการชำระ"
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
            {checkCanTakeAction(userRole, selectedRequest.requestStatus) && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col shrink-0">
                {!confirmAction ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setConfirmAction("reject");
                        setErrorMessage(null);
                      }}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
                    >
                      ไม่อนุมัติ
                    </button>
                    {userRole !== "executive" && (
                      <button
                        onClick={() => {
                          setConfirmAction("return");
                          setErrorMessage(null);
                        }}
                        className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-white border-2 border-amber-200 text-amber-600 font-bold hover:bg-amber-50 hover:border-amber-300 transition-all active:scale-[0.98]"
                      >
                        ส่งกลับแก้ไข
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setConfirmAction("approve");
                        setErrorMessage(null);
                      }}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all active:scale-[0.98]"
                    >
                      อนุมัติ
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                    <h4
                      className={`font-bold text-[14px] mb-2 flex items-center gap-2 ${
                        confirmAction === "approve"
                          ? "text-green-700"
                          : confirmAction === "return"
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {confirmAction === "approve" ? (
                        <CheckCircle2 size={16} />
                      ) : confirmAction === "return" ? (
                        <ShieldAlert size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <span>
                        {confirmAction === "approve"
                          ? "ความเห็นประกอบการพิจารณา (แนบในแบบฟอร์ม)"
                          : confirmAction === "return"
                            ? "ระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข (เช่น แนบเอกสารใหม่)"
                            : "ระบุเหตุผลเพื่อแจ้งกลับให้นักศึกษาทราบ"}
                      </span>
                      <span className="text-red-500 font-bold" title="จำเป็น">*</span>
                    </h4>

                    {confirmAction === "approve" &&
                      originalRequestedAmount > 0 &&
                      Number(selectedRequest.amount) < originalRequestedAmount && (
                        <div className="mb-2.5 text-[12px] bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg flex items-center justify-between">
                          <span>วงเงินที่อนุมัติ (ปรับลดลง):</span>
                          <span className="font-bold text-[#ea580c]">
                            ฿{formatAmount(selectedRequest.amount)}{" "}
                            <span className="text-gray-400 font-normal line-through text-[11px]">
                              (จาก ฿{formatAmount(originalRequestedAmount)})
                            </span>
                          </span>
                        </div>
                      )}

                    <textarea
                      placeholder={
                        confirmAction === "approve"
                          ? "ระบุความเห็นประกอบการพิจารณา เช่น เห็นสมควรให้กู้ยืมเพื่อนำไปใช้จ่าย..."
                          : confirmAction === "return"
                            ? "เช่น ใบแจ้งหนี้ไม่ชัดเจน กรุณาถ่ายรูปและแนบไฟล์มาใหม่..."
                            : "เช่น เอกสารหรือเหตุผลไม่เพียงพอต่อการกู้ยืม..."
                      }
                      className={`w-full border rounded-lg p-3 text-[13px] focus:outline-none resize-none h-20 mb-3 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
                        errorMessage
                          ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      value={remark}
                      onChange={(e) => {
                        setRemark(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />

                    {errorMessage && (
                      <div className="text-[12px] text-red-600 mb-3 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                        <XCircle size={14} className="shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setConfirmAction(null);
                          setErrorMessage(null);
                          setRemark("");
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleConfirmDecision}
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-[13px] font-bold text-white rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                          confirmAction === "approve"
                            ? "bg-[#059669] hover:bg-[#047857]"
                            : confirmAction === "return"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-[#dc2626] hover:bg-[#b91c1c]"
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : confirmAction === "approve" ? (
                          "ยืนยันอนุมัติ"
                        ) : confirmAction === "return" ? (
                          "ยืนยันส่งกลับแก้ไข"
                        ) : (
                          "ยืนยันไม่อนุมัติ"
                        )}
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
