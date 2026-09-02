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
  Phone,
  Landmark,
  CalendarDays,
  ShieldAlert, // เพิ่ม Icon สำหรับเตือนการปกปิดข้อมูล
  MessageSquare,
} from "lucide-react";

// ==========================================
// การกำหนด Type
// ==========================================
export type StudentInfo = {
  name: string;
  studentId: string;
  major: string;
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
  expectedReturnDate: string;
  bankDetails: BankDetails;
};

export type RequestStatus = {
  submitDate: string;
  waitDays: number;
  isOverdue: boolean;
  history: ActionHistory[];
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

export type ActionRequest = StudentInfo &
  LoanDetails &
  RequestStatus & {
    id: string;
    requestStatus: string;
    paymentBehavior?: PaymentBehaviorInfo;
    advisorName?: string;
    advisorComment?: string;
  };

export type UserRole = "advisor" | "executive" | "admin" | "super_admin";

interface RequestsCardProps {
  requests: ActionRequest[];
  userRole?: UserRole;
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

// ฟังก์ชันสำหรับใส่ comma ในตัวเลข
const formatAmount = (amountStr: string) => {
  const num = Number(amountStr);
  if (isNaN(num)) return amountStr;
  return num.toLocaleString();
};

export default function RequestsCard({ requests, userRole = "advisor" }: RequestsCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");

  const canViewSensitiveData = userRole === "admin" || userRole === "super_admin";

  const closeAllModals = () => {
    setSelectedRequest(null);
    setConfirmAction(null);
    setRemark("");
  };

  // ==========================================
  // ฟังก์ชันสำหรับ Render ปุ่มดำเนินการ หรือ ป้ายสถานะ
  // ==========================================
  const renderActionButton = (req: ActionRequest, isMobile: boolean) => {
    const baseClasses = isMobile
      ? "px-4 py-2 text-[13px] rounded-lg transition-colors border whitespace-nowrap text-center"
      : "px-3 py-1.5 text-[13px] rounded-lg transition-colors border whitespace-nowrap text-center";

    // === กำหนดว่าสถานะไหนที่ "รอให้ Role นี้เป็นคนกด" ===
    let isActionable = false;
    if (userRole === "advisor" && req.requestStatus === "รอพิจารณา") isActionable = true;
    if (userRole === "admin" && req.requestStatus === "รอเจ้าหน้าที่ตรวจสอบ") isActionable = true;
    if (userRole === "executive" && req.requestStatus === "รอผู้บริหารอนุมัติ") isActionable = true;

    if (isActionable) {
      return (
        <button
          onClick={() => setSelectedRequest(req)}
          className={`${baseClasses} text-[#ea580c] hover:text-[#c2410c] font-bold bg-orange-50 hover:bg-orange-100 border-orange-200`}
        >
          ตรวจสอบ
        </button>
      );
    }

    // === ถ้าไม่ใช่คิวที่ต้องตรวจสอบ ให้แสดงป้ายสถานะ (สีต่างๆ) ===
    let colorClass = "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200";

    if (req.requestStatus.includes("ไม่อนุมัติ") || req.requestStatus.includes("ยกเลิก")) {
      colorClass = "bg-red-50 hover:bg-red-100 text-red-600 border-red-200";
    } else if (req.requestStatus.includes("รอ")) {
      colorClass = "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200";
    } else if (
      req.requestStatus.includes("อนุมัติแล้ว") ||
      req.requestStatus.includes("สำเร็จ") ||
      req.requestStatus.includes("เสร็จสิ้น")
    ) {
      colorClass = "bg-green-50 hover:bg-green-100 text-green-600 border-green-200";
    }

    return (
      <button
        onClick={() => setSelectedRequest(req)}
        className={`${baseClasses} font-medium ${colorClass}`}
      >
        {req.requestStatus}
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
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">กำหนดคืนเงิน</div>
                  <div className="font-bold text-gray-900">{req.expectedReturnDate}</div>
                </div>
              </div>
              {renderActionButton(req, true)}
            </div>
          </div>
        ))}
      </div>

      {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
      <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px] bg-white">
          <thead>
            <tr className="bg-gray-100/70 border-b border-gray-300 text-gray-700 text-[14px]">
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                รหัสคำร้อง
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[200px]">
                ชื่อ - ข้อมูลนักศึกษา
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                วันที่ยื่น
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 min-w-[200px]">
                รายละเอียดเพื่อนำไปใช้
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนเงิน
              </th>
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                จำนวนงวด
              </th>
              <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-orange-50/20 transition-colors text-[14px]"
              >
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200">{req.id}</td>
                <td className="py-4 px-4 border-r border-gray-200">
                  <div className="font-bold text-gray-900">{req.name}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {req.studentId} • {req.major} • ปี {req.year}
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {req.submitDate}
                </td>
                <td className="py-4 px-4 text-gray-700 border-r border-gray-200">
                  <div className="line-clamp-2">{req.objective}</div>
                </td>
                <td className="py-4 px-4 text-gray-900 font-bold border-r border-gray-200 whitespace-nowrap">
                  {formatAmount(req.amount)}
                </td>
                <td className="py-4 px-4 text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  {req.term} งวด
                </td>
                <td className="py-4 px-4 text-center">{renderActionButton(req, false)}</td>
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
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Wallet size={14} /> จำนวนเงินที่ขอยืม
                  </div>
                  <div className="font-bold text-[16px] sm:text-[18px] text-[#ea580c]">
                    {formatAmount(selectedRequest.amount)}
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
                        {selectedRequest.bankDetails.bankName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[11px]">เลขที่บัญชี</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.bankDetails.accountNumber}
                      </span>
                    </div>
                    <div className="flex flex-col sm:col-span-2">
                      <span className="text-gray-500 text-[11px]">ชื่อบัญชี</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.bankDetails.accountName}
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

              {/* ความเห็นจากอาจารย์ที่ปรึกษา */}
              {selectedRequest.requestStatus !== "รอพิจารณา" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                    <MessageSquare size={15} className="text-[#ea580c]" />{" "}
                    ความเห็นจากอาจารย์ที่ปรึกษา
                  </div>
                  <div className="bg-orange-50/50 p-3.5 rounded-lg border border-orange-100/50">
                    <div className="font-bold text-gray-900 text-[13px] mb-1">
                      {selectedRequest.advisorName || "อ.ที่ปรึกษา"}
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed italic">
                      "
                      {selectedRequest.advisorComment ||
                        "อนุมัติให้ดำเนินการต่อได้ ไม่มีข้อขัดข้อง"}
                      "
                    </p>
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
                          className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${index === selectedRequest.history.length - 1 ? "bg-blue-500 ring-4 ring-blue-50" : "bg-gray-300"}`}
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

            {/* Footer Buttons */}
            {selectedRequest.requestStatus === "รอพิจารณา" && (
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

            {/* Modal ยืนยันพิจารณา */}
            {confirmAction && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                    <h3
                      className={`font-bold text-[16px] ${confirmAction === "approve" ? "text-green-700" : "text-red-600"}`}
                    >
                      {confirmAction === "approve"
                        ? "ความเห็นประกอบการพิจารณา"
                        : "เหตุผลที่ไม่อนุมัติ"}
                    </h3>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-full"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-[13px] text-gray-600 mb-3">
                      {confirmAction === "approve"
                        ? "กรุณาระบุความเห็น (เช่น ความเห็นของอาจารย์ที่ปรึกษา / ผู้ช่วยคณบดี) เพื่อแนบในแบบฟอร์ม"
                        : "กรุณาระบุเหตุผลเพื่อแจ้งกลับให้นักศึกษาทราบและดำเนินการแก้ไข"}
                    </p>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-3.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none h-28 bg-gray-50/50"
                      placeholder={
                        confirmAction === "approve"
                          ? "เช่น เห็นสมควรให้กู้ยืมเพื่อนำไปใช้จ่าย..."
                          : "เช่น เอกสารหรือเหตุผลไม่เพียงพอ..."
                      }
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    ></textarea>
                  </div>
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
                      className={`w-full sm:w-auto px-5 py-2.5 text-[14px] font-bold text-white rounded-xl transition-colors shadow-sm ${confirmAction === "approve" ? "bg-[#059669] hover:bg-[#047857] shadow-green-600/20" : "bg-[#e11d48] hover:bg-[#be123c] shadow-red-600/20"}`}
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
