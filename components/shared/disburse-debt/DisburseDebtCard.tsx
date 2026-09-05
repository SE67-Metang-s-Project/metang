"use client";

import React, { useState, useRef } from "react";
import {
  X,
  CheckCircle2,
  Wallet,
  User,
  Landmark,
  UploadCloud,
  FileImage,
  AlertCircle,
  Copy, // <--- เพิ่มไอคอน Copy เข้ามา
} from "lucide-react";

// ==========================================
// 1. กำหนด Type ให้ตรงกับ mockAdminRequests
// ==========================================
export type BankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type ActionRequest = {
  id: string;
  name: string;
  studentId: string;
  major: string;
  program?: string;
  year: string;
  phone?: string;
  objective: string;
  amount: string;
  term: string;
  expectedReturnDate?: string;
  requestStatus: string;
  submitDate: string;
  waitDays?: number;
  isOverdue?: boolean;
  history?: { action: string; date: string; actor: string }[];
  bankDetails?: BankDetails;
  [key: string]: unknown;
};

interface DisburseDebtCardProps {
  requests: ActionRequest[];
}

export default function DisburseDebtCard({ requests }: DisburseDebtCardProps) {
  const [selectedReq, setSelectedReq] = useState<ActionRequest | null>(null);
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false); // <--- State สำหรับเช็คว่ากดคัดลอกหรือยัง
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeAllModals = () => {
    setSelectedReq(null);
    setUploadedSlip(null);
    setIsCopied(false); // รีเซ็ตสถานะปุ่มคัดลอกเมื่อปิด Modal
  };

  const formatAmount = (amountStr: string) => {
    const num = Number(amountStr);
    return isNaN(num) ? amountStr : num.toLocaleString();
  };

  const getSubmittedTime = (req: ActionRequest) => {
    const submittedAt = req.history?.[0]?.date;
    const time = submittedAt?.match(/\d{1,2}:\d{2}/)?.[0];

    return time ? `${time} น.` : null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedSlip(imageUrl);
    }
  };

  // ฟังก์ชันสำหรับคัดลอกและเปลี่ยนสถานะปุ่ม
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000); // กลับเป็นเหมือนเดิมหลังผ่านไป 2 วินาที
  };

  return (
    <div className="w-full">
      {/* ========================================== */}
      {/* ส่วนที่ 1: ตารางรายการ */}
      {/* ========================================== */}
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed border-collapse text-left">
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
              <tr className="border-b border-gray-300 bg-gray-100/70 text-[14px] text-gray-700">
                <th className="min-w-[130px] whitespace-nowrap border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  <span className="lg:hidden">
                    รหัส
                    <br />
                    คำร้อง
                  </span>
                  <span className="hidden lg:inline">รหัสคำร้อง</span>
                </th>
                <th className="min-w-[200px] border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  ชื่อ - ข้อมูลนักศึกษา
                </th>
                <th className="border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  <span className="lg:hidden">
                    วันที่-เวลา
                    <br />
                    ยื่นคำร้อง
                  </span>
                  <span className="hidden lg:inline">วันที่-เวลายื่นคำร้อง</span>
                </th>
                <th className="min-w-[200px] border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  รายละเอียดเพื่อนำไปใช้
                </th>
                <th className="whitespace-nowrap border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  จำนวนเงิน
                </th>
                <th className="whitespace-nowrap border-r border-gray-300 px-4 py-3.5 text-center font-semibold">
                  จำนวนงวด
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-gray-700">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-gray-200 text-[14px] transition-colors hover:bg-orange-50/20 last:border-b-0"
                >
                  <td className="min-w-[130px] whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center font-normal text-gray-600">
                    {req.id}
                  </td>
                  <td className="border-r border-gray-200 px-4 py-4">
                    <div className="truncate font-normal text-gray-900">
                      {req.name} • {req.studentId}
                    </div>
                    <div className="mt-0.5 truncate text-[14px] text-gray-500">
                      {req.program ?? "พยาบาลศาสตรบัณฑิต"} • ปริญญาตรี • ปี {req.year}
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center font-normal text-gray-600">
                    <div className="flex flex-col items-center leading-relaxed">
                      <span>{req.submitDate}</span>
                      {getSubmittedTime(req) && <span>{getSubmittedTime(req)}</span>}
                    </div>
                  </td>
                  <td className="border-r border-gray-200 px-4 py-4 text-left font-normal text-gray-700">
                    <div className="line-clamp-2">{req.objective}</div>
                  </td>
                  <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center font-normal text-gray-900">
                    {formatAmount(req.amount)}
                  </td>
                  <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center font-normal text-gray-700">
                    {req.term} งวด
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex justify-center">
                      {req.requestStatus !== "disbursed" ? (
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="inline-flex w-fit max-w-full items-center justify-center rounded-md border border-orange-200 bg-white px-4 py-1.5 text-[14px] font-bold text-[#ea580c] transition-colors hover:bg-orange-50"
                        >
                          <span className="block truncate">ตรวจสอบ</span>
                        </button>
                      ) : (
                        <span className="inline-flex w-fit max-w-full items-center justify-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[14px] font-bold text-green-700">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">สำเร็จ</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* ส่วนที่ 2: Modal ยืนยันการโอนเงินแนบสลิป */}
      {/* ========================================== */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className="text-[#ea580c]" size={22} />
                  ดำเนินการเบิกจ่ายเงิน (Disbursement)
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">อ้างอิงคำร้อง: {selectedReq.id}</p>
              </div>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto bg-gray-50/50 space-y-5">
              {/* ========================================== */}
              {/* แยกส่วนข้อมูลเป็น 2 กล่อง: ข้อมูลนักศึกษา และ ยอดเงิน */}
              {/* ========================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* กล่องข้อมูลนักศึกษา */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">โอนเงินให้แก่นักศึกษา</div>
                    <div className="font-bold text-gray-900 text-[15px] mt-0.5">
                      {selectedReq.name}
                    </div>
                    <div className="text-[13px] text-gray-600 mt-0.5">
                      รหัส: {selectedReq.studentId}
                    </div>
                  </div>
                </div>

                {/* กล่องยอดเงินที่ต้องโอน */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center sm:items-end text-left sm:text-right">
                  <div className="text-[13px] text-gray-500 mb-1 flex items-center gap-1.5">
                    <Wallet size={15} /> ยอดเงินที่ต้องโอน
                  </div>
                  <div className="font-black text-[#ea580c] text-[26px] leading-tight">
                    ฿{formatAmount(selectedReq.amount)}
                  </div>
                </div>
              </div>

              {/* ข้อมูลบัญชีธนาคาร */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200">
                <div className="text-[13px] font-bold text-blue-800 flex items-center gap-2 mb-3">
                  <Landmark size={16} /> บัญชีปลายทาง (คัดลอกเพื่อโอนเงิน)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="block text-[11px] text-gray-500 mb-0.5">ธนาคาร</span>
                    <span className="font-bold text-gray-900">
                      {selectedReq.bankDetails?.bankName ?? "-"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="block text-[11px] text-gray-500 mb-0.5">ชื่อบัญชี</span>
                    <span className="font-bold text-gray-900">
                      {selectedReq.bankDetails?.accountName ?? "-"}
                    </span>
                  </div>

                  {/* เปลี่ยนแปลง: เพิ่มลูกเล่นปุ่มคัดลอก */}
                  <div className="bg-white p-3 rounded-lg border border-blue-100 sm:col-span-2 flex justify-between items-center transition-all">
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-0.5">เลขที่บัญชี</span>
                      <span className="font-mono font-bold text-xl text-blue-700 tracking-wider">
                        {selectedReq.bankDetails?.accountNumber ?? "-"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedReq.bankDetails?.accountNumber ?? "")}
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
                  </div>
                </div>
              </div>

              {/* ส่วนอัปโหลดสลิป */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileImage size={16} className="text-gray-400" />
                  แนบสลิปหลักฐานการโอนเงิน <span className="text-red-500">*</span>
                </div>

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
                    <div className="text-[14px] font-bold text-gray-700">
                      คลิกเพื่ออัปโหลดสลิปโอนเงิน
                    </div>
                    <div className="text-[12px] text-gray-500 mt-1">
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
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-5 bg-white border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={closeAllModals}
                className="flex-1 py-3 text-[14px] font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                disabled={!uploadedSlip}
                onClick={() => {
                  console.log(`Disbursed for ID: ${selectedReq.id}`);
                  closeAllModals();
                }}
                className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-all shadow-sm
                  ${
                    uploadedSlip
                      ? "bg-[#059669] hover:bg-[#047857] shadow-green-600/20"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                <CheckCircle2 size={18} /> ยืนยันว่าโอนเงินแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
