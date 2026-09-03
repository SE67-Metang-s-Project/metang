"use client";
import React from "react";
import { X, Receipt } from "lucide-react";
import { LoanTransaction, PaymentEvidence } from "@/components/shared/types/loan.types";

interface RequestDetailModalProps {
  loan: LoanTransaction;
  onClose: () => void;
  onSelectEvidence: (evidence: PaymentEvidence) => void; // ฟังก์ชันเมื่อคลิกสลิป
}

export default function RequestDetailModal({ loan, onClose, onSelectEvidence }: RequestDetailModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
      <div className="bg-[#f8fafc] rounded-2xl w-full max-w-3xl flex flex-col max-h-[95vh] overflow-hidden">
        
        <div className="flex justify-between p-4 border-b bg-white">
          <h2 className="font-bold">รายละเอียดคำร้อง {loan.id}</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
           {/* โค้ดสรุปคำร้อง ตารางผ่อนชำระ ... */}
           
           {/* ส่วนประวัติสลิป */}
           <div className="bg-white p-4 rounded-xl shadow-sm">
             <h3 className="font-bold mb-3 flex items-center gap-2"><Receipt /> ประวัติสลิป</h3>
             {loan.paymentHistory.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => onSelectEvidence(ev)} // เมื่อคลิก ให้ส่งข้อมูลสลิปออกไปให้แม่ (Page)
                  className="p-3 border rounded-lg cursor-pointer hover:border-[#ea580c] mb-2"
                >
                  งวดที่ {ev.installmentNumber} - สถานะ: {ev.status}
                </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}