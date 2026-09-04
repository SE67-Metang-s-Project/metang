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
  ShieldAlert,
  MessageSquare,
  Image as ImageIcon,
  Receipt,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// 1. Types (รวมของ RequestsCard และ ระบบ Slip)
// ==========================================
export type PaymentEvidence = {
  id: string;
  installmentNumber: number;
  amount: string;
  paidAt: string;
  verifiedAt?: string;
  status: "pending" | "verified" | "rejected";
  slipImageUrl: string;
};

// นำ Type เดิมของ RequestsCard มาทั้งหมด...
export type ActionRequest = {
  id: string;
  name: string;
  studentId: string;
  major: string;
  program?: string;
  year: string;
  phone: string;
  objective: string;
  amount: string;
  term: string;
  expectedReturnDate: string;
  submitDate: string;
  requestStatus: string;
  waitDays?: number;
  isOverdue?: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  paymentBehavior?: {
    onTimeInstallments?: number;
    lateInstallments?: number;
    totalLoanRequests?: number;
  };
  approvals?: {
    step: "advisor" | "admin" | "executive";
    actorName: string;
    comment: string;
    decision: "approved" | "rejected" | "returned" | "pending";
    date: string;
  }[];
  history?: { action: string; date: string; actor: string }[];
  // สิ่งที่เพิ่มเข้ามาสำหรับหน้านี้:
  paymentHistory?: PaymentEvidence[];
};

interface VerifySlipCardProps {
  requests: ActionRequest[];
  userRole?: "advisor" | "executive" | "admin" | "super_admin";
}

// ==========================================
// 2. Helper Functions
// ==========================================
const formatAmount = (amountStr: string) => {
  const num = Number(amountStr);
  return isNaN(num) ? amountStr : num.toLocaleString();
};

const hasPendingSlip = (history?: PaymentEvidence[]) => {
  if (!history) return false;
  return history.some((ev) => ev.status === "pending");
};

export default function VerifySlipCard({ requests, userRole = "super_admin" }: VerifySlipCardProps) {
  // State สำหรับ Modal คำร้องหลัก
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);

  // State สำหรับ Modal ตรวจสลิปย่อย
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
        {requests.map((req, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold text-gray-900 text-[15px] leading-tight">{req.name}</div>
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
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${
                  hasPendingSlip(req.paymentHistory)
                    ? "bg-orange-50 hover:bg-orange-100 text-[#ea580c] border-orange-200"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                }`}
              >
                {hasPendingSlip(req.paymentHistory) ? (
                  <>
                    <Receipt size={14} /> ตรวจสอบสลิป
                  </>
                ) : (
                  "ดูรายละเอียด"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* มุมมอง Desktop */}
      {/* ========================================== */}
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
              <th className="py-3.5 px-4 font-semibold border-r border-gray-300 whitespace-nowrap">
                ยอดกู้ยืมรวม
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
                    {req.studentId} • {req.major}
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {req.submitDate?.split(" ")[0]}
                </td>
                <td className="py-4 px-4 text-gray-900 font-bold border-r border-gray-200 whitespace-nowrap">
                  ฿{formatAmount(req.amount)}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-[13px] font-bold rounded-lg border transition-colors ${
                      hasPendingSlip(req.paymentHistory)
                        ? "bg-orange-50 hover:bg-orange-100 text-[#ea580c] border-orange-200"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm"
                    }`}
                  >
                    {hasPendingSlip(req.paymentHistory) ? (
                      <>
                        <Receipt size={14} /> ตรวจสอบสลิป
                      </>
                    ) : (
                      "ดูรายละเอียด"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* Modal 1: รายละเอียดคำร้อง (เหมือน RequestsCard) */}
      {/* ========================================== */}
      {selectedRequest && !selectedEvidence && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
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

              {/* NEW! ประวัติหลักฐานการชำระ (แทรกเพิ่มเข้ามา) */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
                  <Receipt size={15} className="text-[#ea580c]" /> ประวัติหลักฐานการชำระ
                </div>
                <div className="space-y-3">
                  {!selectedRequest.paymentHistory ||
                  selectedRequest.paymentHistory.length === 0 ? (
                    <div className="text-center text-gray-500 text-[12px] py-4 bg-gray-50 rounded-lg">
                      ยังไม่มีประวัติการแนบสลิป
                    </div>
                  ) : (
                    selectedRequest.paymentHistory.map((evidence) => (
                      <div
                        key={evidence.id}
                        onClick={() => setSelectedEvidence(evidence)}
                        className="group border border-gray-200 rounded-xl p-3 flex items-center justify-between hover:border-[#ea580c] hover:bg-orange-50/20 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={evidence.slipImageUrl}
                              alt="slip"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[13px] text-gray-900">
                              งวดที่ {evidence.installmentNumber} • ฿{formatAmount(evidence.amount)}
                            </div>
                            <div className="text-[11px] text-gray-500">ชำระ: {evidence.paidAt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {evidence.status === "verified" ? (
                            <span className="bg-green-50 text-green-700 text-[11px] px-2 py-1 rounded font-bold">
                              ตรวจสอบแล้ว
                            </span>
                          ) : evidence.status === "pending" ? (
                            <span className="bg-orange-100 text-[#ea580c] text-[11px] px-2 py-1 rounded font-bold">
                              รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-700 text-[11px] px-2 py-1 rounded font-bold">
                              ไม่อนุมัติ
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            className="text-gray-400 group-hover:text-[#ea580c]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* วัตถุประสงค์ (จาก RequestsCard เดิม) */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2.5 border-b border-gray-100 pb-2">
                  <FileText size={15} className="text-gray-400" /> วัตถุประสงค์
                </div>
                <p className="text-[13px] text-gray-800 leading-relaxed">
                  {selectedRequest.objective}
                </p>
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-[12px] text-gray-500 mb-1">วันที่ชำระเงิน</div>
                  <div className="font-bold text-gray-900">{selectedEvidence.paidAt}</div>
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
                        className={`px-4 py-2 text-white font-bold rounded-lg text-[13px] ${slipConfirmAction === "approve" ? "bg-green-600" : "bg-red-600"}`}
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
