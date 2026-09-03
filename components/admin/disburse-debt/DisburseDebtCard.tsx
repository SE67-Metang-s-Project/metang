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
  bankDetails?: BankDetails;
  [key: string]: unknown; // อนุญาตให้มีฟิลด์อื่นๆ เพิ่มเติมจาก mock ได้ (เช่น paymentBehavior, approvals)
};

interface DisburseDebtCardProps {
  requests: ActionRequest[];
}

export default function DisburseDebtCard({ requests }: DisburseDebtCardProps) {
  const [selectedReq, setSelectedReq] = useState<ActionRequest | null>(null);
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeAllModals = () => {
    setSelectedReq(null);
    setUploadedSlip(null);
  };

  const formatAmount = (amountStr: string) => {
    const num = Number(amountStr);
    return isNaN(num) ? amountStr : num.toLocaleString();
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
      {/* ========================================== */}
      {/* ส่วนที่ 1: ตารางรายการ */}
      {/* ========================================== */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-800 text-[14px]">
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[15%]">
                  รหัสคำร้อง
                </th>
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[22%]">
                  ชื่อ - ข้อมูลนักศึกษา
                </th>
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[10%]">
                  วันที่ยื่น
                </th>
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[25%]">
                  รายละเอียดเพื่อนำไปใช้
                </th>
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[10%]">
                  จำนวนเงิน
                </th>
                <th className="py-3 px-4 font-semibold border-r border-gray-200 w-[8%] whitespace-nowrap">
                  จำนวนงวด
                </th>
                <th className="py-3 px-4 font-semibold text-center w-[10%] whitespace-nowrap">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-gray-700">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-4 border-r border-gray-200 text-gray-600">{req.id}</td>
                  <td className="py-4 px-4 border-r border-gray-200">
                    <div className="font-bold text-gray-900">{req.name}</div>
                    <div className="text-[13px] text-gray-500 mt-0.5">
                      {req.studentId} • {req.major} • ปี {req.year}
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200">{req.submitDate}</td>
                  <td className="py-4 px-4 border-r border-gray-200 text-gray-600">{req.objective}</td>
                  <td className="py-4 px-4 border-r border-gray-200 font-bold text-gray-900">
                    {formatAmount(req.amount)}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200 whitespace-nowrap">
                    {req.term} งวด
                  </td>
                  <td className="py-4 px-4 text-center">
                    {/* เนื่องจาก mock ตัวนี้สถานะหลากหลาย เพื่อให้เทสต์ปุ่มตรวจสอบได้ จะเช็คว่าถ้าสถานะไม่ใช่ 'disbursed' ให้โชว์ปุ่ม */}
                    {req.requestStatus !== "disbursed" ? (
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-orange-200 text-[#ea580c] hover:bg-orange-50 text-[13px] font-bold rounded-md transition-colors whitespace-nowrap"
                      >
                        ตรวจสอบ
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                        <CheckCircle2 size={14} /> สำเร็จ
                      </span>
                    )}
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
              {/* ยอดเงินและผู้รับ */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">โอนเงินให้แก่นักศึกษา</div>
                    <div className="font-bold text-gray-900 text-[16px]">
                      {selectedReq.name}
                    </div>
                    <div className="text-[13px] text-gray-600">รหัส: {selectedReq.studentId}</div>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-[12px] text-gray-500 mb-0.5">ยอดเงินที่ต้องโอน</div>
                  <div className="font-black text-[#ea580c] text-[24px]">
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
                  <div className="bg-white p-3 rounded-lg border border-blue-100 sm:col-span-2 flex justify-between items-center">
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-0.5">เลขที่บัญชี</span>
                      <span className="font-mono font-bold text-xl text-blue-700 tracking-wider">
                        {selectedReq.bankDetails?.accountNumber ?? "-"}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(selectedReq.bankDetails?.accountNumber ?? "")
                      }
                      className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      คัดลอก
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
