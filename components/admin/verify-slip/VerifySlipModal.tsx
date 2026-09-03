"use client";
import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { PaymentEvidence, LoanTransaction } from "@/components/shared/types/loan.types";

interface VerifySlipModalProps {
  evidence: PaymentEvidence;
  loanInfo: LoanTransaction; // เอาไว้แสดงอ้างอิงรหัสคำร้อง
  onClose: () => void;
}

export default function VerifySlipModal({ evidence, loanInfo, onClose }: VerifySlipModalProps) {
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");

  const handleConfirm = () => {
    console.log(`Action: ${confirmAction}, ID: ${evidence.id}`);
    onClose(); // เสร็จแล้วสั่งปิดตัวเอง
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between p-4 border-b">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="text-[#ea580c]" /> ตรวจสอบสลิปงวดที่ {evidence.installmentNumber}
          </h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* Body (แยกซ้ายขวา) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
           {/* ใส่โค้ดส่วนแสดงรูปภาพ (ซ้าย) และข้อมูล (ขวา) ตรงนี้ */}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t flex justify-end gap-2">
           <button onClick={onClose}>ยกเลิก</button>
           <button onClick={handleConfirm} className="bg-[#ea580c] text-white px-4 py-2 rounded-lg">ยืนยัน</button>
        </div>

      </div>
    </div>
  );
}