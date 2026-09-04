"use client";

import React, { useState, useEffect } from "react";
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
  Phone,
  Landmark,
  CalendarDays,
  ShieldAlert,
  MessageSquare,
  Pencil, // <--- เพิ่ม Import Icon สำหรับแก้ไข
} from "lucide-react";

// ==========================================
// การกำหนด Type (อ้างอิงจาก Database Schema)
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

// ==========================================
// โครงสร้างการอนุมัติ (รองรับหลาย Role)
// ==========================================
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
  };

export type UserRole = "advisor" | "executive" | "admin" | "super_admin";

interface RequestsCardProps {
  requests: ActionRequest[];
  userRole?: UserRole;
  tableLayout?: "default" | "executive";
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

function calculateInstallmentDates(startDateStr: string, term: string) {
  const termsCount = parseInt(term, 10) || 0;
  if (termsCount === 0 || !startDateStr) return [];

  const parts = startDateStr.split(" ");
  if (parts.length !== 3) return [];

  const day = parseInt(parts[0], 10);
  const monthIdx = thaiMonths.indexOf(parts[1]);
  const year = parseInt(parts[2], 10) - 543;

  if (isNaN(day) || monthIdx === -1 || isNaN(year)) return [];

  const startDate = new Date(year, monthIdx, day);
  const installments = [];

  for (let i = 1; i <= termsCount; i++) {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + i * 30);
    const nextDay = nextDate.getDate();
    const nextMonth = thaiMonths[nextDate.getMonth()];
    const nextYear = nextDate.getFullYear() + 543;
    installments.push({
      installmentNumber: i,
      dateString: `${nextDay} ${nextMonth} ${nextYear}`,
    });
  }
  return installments;
}

const formatAmount = (amountStr: string) => {
  const num = Number(amountStr);
  if (isNaN(num)) return amountStr;
  return num.toLocaleString();
};

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
  if ((role === "admin" || role === "super_admin") && (s === "pending_admin" || s.includes("รอเจ้าหน้าที่ตรวจสอบ")))
    return true;
  if (role === "executive" && (s === "pending_executive" || s.includes("รอผู้บริหารอนุมัติ")))
    return true;
  return false;
};

export default function RequestsCard({
  requests,
  userRole = "advisor",
  tableLayout = "executive",
}: RequestsCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "return" | null>(null);
  const [remark, setRemark] = useState("");
  const selectedRequestHistory = selectedRequest?.history ?? [];
  const isExecutiveTable = tableLayout === "executive";

  // ==========================================
  // State สำหรับการแก้ไขวงเงิน (Admin / Super Admin)
  // ==========================================
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState("");

  const canViewSensitiveData = userRole === "admin" || userRole === "super_admin";
  const canEditAmount = userRole === "admin" || userRole === "super_admin";

  // รีเซ็ตค่าวงเงินเมื่อเลือกคำร้องใหม่
  useEffect(() => {
    if (selectedRequest) {
      setEditAmountValue(selectedRequest.amount);
      setIsEditingAmount(false);
    }
  }, [selectedRequest]);

  const closeAllModals = () => {
    setSelectedRequest(null);
    setConfirmAction(null);
    setRemark("");
    setIsEditingAmount(false);
  };

  // ฟังก์ชันบันทึกวงเงินใหม่
  const handleSaveAmount = () => {
    if (selectedRequest && editAmountValue) {
      setSelectedRequest({ ...selectedRequest, amount: editAmountValue });
      setIsEditingAmount(false);
      console.log(`อัปเดตวงเงินใหม่สำหรับคำร้อง ${selectedRequest.id}: ${editAmountValue}`);
    }
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
          onClick={() => setSelectedRequest(req)}
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
        onClick={() => setSelectedRequest(req)}
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
              <span className="font-semibold text-gray-900">นำไปใช้: </span>
              {req.objective}
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
              <div className="flex gap-4">
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">จำนวนที่ขอ</div>
                  <div className="font-bold text-[#ea580c]">{formatAmount(req.amount)}</div>
                </div>
              </div>
              {renderActionButton(req, true)}
            </div>
          </div>
        ))}
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
            {requests.map((req, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
              >
                <td className="min-w-[130px] py-4 px-4 text-center font-normal text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {req.id}
                </td>
                <td className="py-4 px-4 border-r border-gray-200">
                  <div
                    className={
                      isExecutiveTable
                        ? "truncate font-normal text-gray-900"
                        : "font-bold text-gray-900"
                    }
                  >
                    {isExecutiveTable ? `${req.name} • ${req.studentId}` : req.name}
                  </div>
                  <div
                    className={`mt-0.5 ${isExecutiveTable ? "truncate text-[14px]" : "text-[13px]"} text-gray-500`}
                  >
                    {isExecutiveTable
                      ? `${req.program ?? "พยาบาลศาสตรบัณฑิต"} • ปริญญาตรี • ปี ${req.year}`
                      : `${req.studentId} • ${req.major} • ปี ${req.year}`}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Modal หลัก: ตรวจสอบรายละเอียดคำร้อง */}
      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex justify-between items-start px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
              <div className="pr-2">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  คำร้อง {selectedRequest.id}
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="hidden sm:inline-block bg-yellow-100 text-yellow-800 text-[12px] font-bold px-2.5 py-1 rounded-md">
                  {selectedRequest.history?.[selectedRequest.history.length - 1]?.action ||
                    "ยื่นคำร้อง"}
                </span>
                <button
                  onClick={closeAllModals}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-4">
              {/* ข้อมูลคณะ/สาขา และ เบอร์โทร */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                  <GraduationCap size={24} />
                </div>
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-1 w-full">
                    <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px]">
                      {selectedRequest.name}
                    </h3>
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0 border border-gray-200 mt-1 sm:mt-0">
                      ยื่นเมื่อ {selectedRequest.submitDate}
                    </span>
                  </div>
                  <div className="text-[13px] text-gray-700 font-medium mt-1">คณะพยาบาลศาสตร์</div>
                  <div className="text-[13px] text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{selectedRequest.studentId}</span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span>
                      {selectedRequest.major} · ปี {selectedRequest.year}
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Phone size={12} /> {selectedRequest.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2 ช่อง (จำนวนเงิน, กำหนดคืน) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* ---------------------------------------------------- */}
                {/* แก้ไข: ส่วนที่ให้ Admin แก้ไขตัวเลขวงเงินได้ */}
                {/* ---------------------------------------------------- */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm relative">
                  <div className="text-[12px] text-gray-500 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5">
                      <Wallet size={14} /> จำนวนเงินที่ขอยืม
                    </span>
                    {/* ปุ่มแก้ไข จะโชว์เฉพาะ Role ที่กำหนด และตอนที่ยังไม่ได้กดแก้ */}
                    {canEditAmount && !isEditingAmount && (
                      <button
                        onClick={() => setIsEditingAmount(true)}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <Pencil size={12} /> ปรับวงเงิน
                      </button>
                    )}
                  </div>

                  {isEditingAmount ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-gray-700">฿</span>
                      <input
                        type="number"
                        value={editAmountValue}
                        onChange={(e) => setEditAmountValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-[14px] font-bold text-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveAmount}
                        className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAmount(false);
                          setEditAmountValue(selectedRequest.amount);
                        }}
                        className="bg-gray-100 text-gray-600 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="font-bold text-[16px] sm:text-[18px] text-[#ea580c]">
                      ฿{formatAmount(selectedRequest.amount)}
                    </div>
                  )}
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

              {/* วันที่กำหนดชำระ */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                  <CalendarDays size={15} className="text-[#ea580c]" /> กำหนดการผ่อนชำระ (งวดละ 30
                  วัน)
                </div>
                <div className="flex flex-col gap-2">
                  {calculateInstallmentDates(selectedRequest.submitDate, selectedRequest.term).map(
                    (installment) => (
                      <div
                        key={installment.installmentNumber}
                        className="flex justify-between items-center bg-orange-50/50 px-3 py-2.5 rounded-lg border border-orange-100/50 text-[13px]"
                      >
                        <span className="text-gray-600 font-medium">
                          งวดที่ {installment.installmentNumber}
                        </span>
                        <span className="text-gray-900 font-bold">{installment.dateString}</span>
                      </div>
                    ),
                  )}
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

              {/* ความเห็นประกอบการพิจารณา (แสดงทุก Role ก่อนหน้า) */}
              {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                    <MessageSquare size={15} className="text-[#ea580c]" /> ความเห็นประกอบการพิจารณา
                  </div>
                  <div className="space-y-3">
                    {selectedRequest.approvals.map((approval, idx) => (
                      <div
                        key={idx}
                        className="bg-orange-50/50 p-3.5 rounded-lg border border-orange-100/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-gray-900 text-[13px]">
                            {approval.actorName}{" "}
                            <span className="text-gray-500 font-normal text-[12px]">
                              ({getRoleDisplay(approval.step)})
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500">{approval.date}</span>
                        </div>
                        <p className="text-[13px] text-gray-700 leading-relaxed italic">
                          &ldquo;{approval.comment}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                          className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${index === selectedRequestHistory.length - 1 ? "bg-blue-500 ring-4 ring-blue-50" : "bg-gray-300"}`}
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

            {/* Footer Buttons - แสดงปุ่มอนุมัติ/ไม่อนุมัติเฉพาะเมื่อตรงเงื่อนไขของ Role */}
            {checkCanTakeAction(userRole, selectedRequest.requestStatus) && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col shrink-0">
                {/* ถ้ายังไม่ได้กดเลือก ให้โชว์ 3 ปุ่ม */}
                {!confirmAction ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => setConfirmAction("reject")}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-white border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
                    >
                      ไม่อนุมัติ
                    </button>

                    <button
                      onClick={() => setConfirmAction("return")}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-white border-2 border-amber-200 text-amber-600 font-bold hover:bg-amber-50 hover:border-amber-300 transition-all active:scale-[0.98]"
                    >
                      ส่งกลับแก้ไข
                    </button>

                    <button
                      onClick={() => setConfirmAction("approve")}
                      className="w-full sm:flex-1 py-3 flex items-center justify-center rounded-xl bg-[#059669] text-white font-bold hover:bg-[#047857] shadow-sm shadow-green-600/20 transition-all active:scale-[0.98]"
                    >
                      อนุมัติ
                    </button>
                  </div>
                ) : (
                  // ถ้ากดเลือกแล้ว ให้โชว์กล่องข้อความขยายลงมา
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
                      {confirmAction === "approve"
                        ? "ความเห็นประกอบการพิจารณา (แนบในแบบฟอร์ม)"
                        : confirmAction === "return"
                          ? "ระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข (เช่น แนบเอกสารใหม่)"
                          : "ระบุเหตุผลเพื่อแจ้งกลับให้นักศึกษาทราบ"}
                    </h4>

                    <textarea
                      placeholder={
                        confirmAction === "approve"
                          ? "เช่น เห็นสมควรให้กู้ยืมเพื่อนำไปใช้จ่าย..."
                          : confirmAction === "return"
                            ? "เช่น ใบแจ้งหนี้ไม่ชัดเจน กรุณาถ่ายรูปและแนบไฟล์มาใหม่..."
                            : "เช่น เอกสารหรือเหตุผลไม่เพียงพอต่อการกู้ยืม..."
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-20 mb-3 bg-white"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      autoFocus
                    />

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
                            `Action: ${confirmAction}, ID: ${selectedRequest.id}, Remark: ${remark}`,
                          );
                          closeAllModals();
                        }}
                        className={`px-4 py-2 text-[13px] font-bold text-white rounded-lg shadow-sm ${
                          confirmAction === "approve"
                            ? "bg-[#059669] hover:bg-[#047857]"
                            : confirmAction === "return"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-[#dc2626] hover:bg-[#b91c1c]"
                        }`}
                      >
                        {confirmAction === "approve"
                          ? "ยืนยันอนุมัติ"
                          : confirmAction === "return"
                            ? "ยืนยันส่งกลับแก้ไข"
                            : "ยืนยันไม่อนุมัติ"}
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
