"use client";

import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  History,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ActionRequest } from "@/components/advisor/pending/RequestsCard";
import styles from "@/app/student/student.module.css";

interface RequestDetailsModalProps {
  request: ActionRequest;
  onClose: () => void;
}

const formatAmount = (amount: string) => Number(amount).toLocaleString("th-TH");

export default function RequestDetailsModal({ request, onClose }: RequestDetailsModalProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");
  const latestAction = request.history.at(-1)?.action;
  const canDecide = latestAction === "ยื่นคำขอกู้ยืม";
  const executiveStatus = canDecide ? "รอผู้บริหารอนุมัติ" : latestAction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="pr-2">
            <h2 className="text-[20px] font-bold leading-tight text-gray-900">คำร้อง {request.id}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`hidden sm:inline-block ${styles.loanDetailStatus} ${styles.waitingExecutiveApproval}`}
            >
              {executiveStatus}
            </span>
            <button
              onClick={onClose}
              aria-label="ปิดรายละเอียดคำร้อง"
              className="rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
          <div className="sm:hidden">
            <span className={`${styles.loanDetailStatus} ${styles.waitingExecutiveApproval}`}>
              สถานะ: {executiveStatus}
            </span>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">คณะพยาบาลศาสตร์</h3>
              <p className="mt-0.5 text-[14px] text-gray-500">
                {request.major} · {request.degree ?? "ปริญญาตรี"} · ปี {request.year}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[14px] text-gray-500"><Wallet size={14} /> จำนวนที่ขอ</p>
              <p className="mt-1 text-[18px] font-bold text-[#ea580c]">{formatAmount(request.amount)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[14px] text-gray-500"><Clock size={14} /> จำนวนงวดที่ผ่อน</p>
              <p className="mt-1 text-[18px] font-bold text-gray-900">{request.term} งวด</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[14px] font-semibold text-gray-700"><FileText size={15} className="text-gray-400" /> รายละเอียดคำร้อง</p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-gray-800">{request.objective}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-gray-700"><CreditCard size={15} className="text-[#ea580c]" /> พฤติกรรมการชำระ</p>
              <span className={`rounded-full border px-2.5 py-0.5 text-[14px] font-bold ${(request.paymentBehavior?.lateInstallments ?? 0) === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                ● {request.paymentBehavior?.onTimeStatusLabel ?? "ชำระตรงเวลา"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[14px]">
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-gray-500">ประวัติกู้ยืม<p className="mt-0.5 text-[14px] font-bold text-gray-900">{request.paymentBehavior?.totalLoanRequests ?? 3} ครั้ง</p></div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-emerald-700">ตรงเวลา<p className="mt-0.5 text-[14px] font-bold text-emerald-800">{request.paymentBehavior?.onTimeInstallments ?? 12} งวด</p></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-gray-500">ล่าช้า<p className="mt-0.5 text-[14px] font-bold text-gray-900">{request.paymentBehavior?.lateInstallments ?? 0} งวด</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[14px] font-semibold text-gray-700"><History size={15} className="text-gray-400" /> ประวัติการดำเนินการ</p>
            <div className="ml-2 space-y-5 border-l-2 border-blue-200">
              {request.history.map((step, index) => <div key={`${step.action}-${step.date}`} className="relative pl-5"><span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${index === request.history.length - 1 ? "bg-blue-500 ring-4 ring-blue-50" : "bg-gray-300"}`} /><p className="text-[14px] font-bold text-gray-900">{step.action}</p><p className="mt-0.5 text-[14px] text-gray-500">{step.date} · {step.actor}</p></div>)}
            </div>
          </div>
        </div>

        {canDecide && <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 sm:flex-row"><button onClick={() => setDecision("reject")} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-white py-3 font-bold text-red-600 hover:bg-red-50 sm:flex-1"><XCircle size={18} /> ไม่อนุมัติ</button><button onClick={() => setDecision("approve")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#059669] py-3 font-bold text-white hover:bg-[#047857] sm:flex-1"><CheckCircle2 size={18} /> อนุมัติ</button></div>}

        {decision && <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"><div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h3 className={`text-[16px] font-bold ${decision === "approve" ? "text-green-700" : "text-red-600"}`}>{decision === "approve" ? "ยืนยันการอนุมัติ" : "ระบุเหตุผลในการไม่อนุมัติ"}</h3><button onClick={() => setDecision(null)} className="rounded-full bg-gray-50 p-1.5 text-gray-400"><X size={18} /></button></div><div className="p-5"><textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="เพิ่มความเห็นประกอบ (ถ้ามี)" className="h-28 w-full resize-none rounded-xl border border-gray-300 bg-gray-50/50 p-3.5 text-[14px] focus:border-blue-500 focus:outline-none" /></div><div className="flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/50 px-5 py-4"><button onClick={() => setDecision(null)} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-600">ยกเลิก</button><button onClick={onClose} className={`rounded-xl px-5 py-2.5 text-[14px] font-bold text-white ${decision === "approve" ? "bg-[#059669]" : "bg-[#e11d48]"}`}>{decision === "approve" ? "ยืนยันอนุมัติ" : "ยืนยันไม่อนุมัติ"}</button></div></div></div>}
      </div>
    </div>
  );
}
