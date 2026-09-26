"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  ImageOff,
  X,
} from "lucide-react";
import ImageWithSkeleton from "@/components/shared/ImageWithSkeleton";

export type PaymentEvidenceRecord = {
  id?: string;
  status?: string;
  installmentNumber: number;
  amount: number | string;
  paidAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  slipImageUrl?: string;
};

type PaymentEvidenceHistoryProps = {
  payments?: PaymentEvidenceRecord[];
};

type EvidenceStatus = "verified" | "failed" | "pending";

function getEvidenceStatus(status?: string): EvidenceStatus {
  const normalized = status?.toLowerCase();
  if (normalized === "verified" || normalized === "confirmed" || normalized === "success") {
    return "verified";
  }
  if (normalized === "failed" || normalized === "rejected") return "failed";
  return "pending";
}

function formatAmount(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("th-TH") : "-";
}

function valueOrDash(value?: string) {
  return value?.trim() || "-";
}

const statusConfig = {
  verified: {
    label: "Verified",
    cardClass: "border-emerald-100 bg-emerald-50/50 text-emerald-800",
    iconClass: "bg-emerald-700 text-white",
  },
  failed: {
    label: "Failed",
    cardClass: "border-red-100 bg-red-50/70 text-red-800",
    iconClass: "bg-red-600 text-white",
  },
  pending: {
    label: "Pending",
    cardClass: "border-amber-100 bg-amber-50/80 text-amber-900",
    iconClass: "bg-amber-500 text-white",
  },
} as const;

function StatusPill({ status }: { status: EvidenceStatus }) {
  const config = statusConfig[status];
  const Icon = status === "verified" ? Check : status === "failed" ? X : Clock3;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.cardClass}`}>
      <span className={`flex size-5 items-center justify-center rounded-full ${config.iconClass}`}>
        <Icon aria-hidden="true" size={13} strokeWidth={3} />
      </span>
      {config.label}
    </span>
  );
}

export default function PaymentEvidenceHistory({ payments = [] }: PaymentEvidenceHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const attemptsByInstallment = new Map<number, number>();
  const totalAttemptsByInstallment = new Map<number, number>();
  payments.forEach((payment) => {
    totalAttemptsByInstallment.set(
      payment.installmentNumber,
      (totalAttemptsByInstallment.get(payment.installmentNumber) ?? 0) + 1,
    );
  });
  const verifiedCount = payments.filter((payment) => getEvidenceStatus(payment.status) === "verified").length;
  const failedCount = payments.filter((payment) => getEvidenceStatus(payment.status) === "failed").length;
  const pendingCount = payments.filter((payment) => getEvidenceStatus(payment.status) === "pending").length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
        <FileText aria-hidden="true" className="text-gray-500" size={20} strokeWidth={2.2} />
        <h3 className="text-[17px] font-semibold text-gray-900">ประวัติหลักฐานการชำระเงิน</h3>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {([
          ["verified", verifiedCount],
          ["failed", failedCount],
          ["pending", pendingCount],
        ] as const).map(([status, count]) => {
          const config = statusConfig[status];
          const Icon = status === "verified" ? Check : status === "failed" ? X : Clock3;
          return (
            <div className={`flex items-center gap-2 rounded-xl border p-2.5 ${config.cardClass}`} key={status}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}>
                <Icon aria-hidden="true" size={17} strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{count}</p>
                <p className="mt-1 text-[11px] font-semibold leading-none sm:text-xs">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 sm:grid">
          <span>งวด</span>
          <span>จำนวนเงิน</span>
          <span className="min-w-28 text-right">สถานะ</span>
        </div>
        {payments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            ยังไม่มีหลักฐานการชำระเงิน
          </div>
        ) : payments.map((payment, index) => {
          const attempt = (attemptsByInstallment.get(payment.installmentNumber) ?? 0) + 1;
          attemptsByInstallment.set(payment.installmentNumber, attempt);
          const id = payment.id ?? `${payment.installmentNumber}-${index}`;
          const status = getEvidenceStatus(payment.status);
          const expanded = expandedId === id;
          const hasMultipleAttempts = (totalAttemptsByInstallment.get(payment.installmentNumber) ?? 0) > 1;

          return (
            <div className={`border-b border-gray-100 last:border-b-0 ${expanded && status === "failed" ? "bg-red-50/50" : "bg-white"}`} key={id}>
              <button
                aria-expanded={expanded}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4"
                onClick={() => setExpandedId(expanded ? null : id)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-700">
                    <FileText aria-hidden="true" size={19} strokeWidth={2.1} />
                  </span>
                  <span>
                    <strong className="block text-sm text-gray-900">
                      ชำระงวดที่ {payment.installmentNumber}
                      {hasMultipleAttempts ? ` (ครั้งที่ ${attempt})` : ""}
                    </strong>
                    <span className="mt-0.5 block text-xs text-gray-500 sm:hidden">{formatAmount(payment.amount)} บาท</span>
                  </span>
                </span>
                <strong className="hidden text-sm text-gray-900 sm:block">{formatAmount(payment.amount)} บาท</strong>
                <span className="flex items-center justify-end gap-2">
                  <StatusPill status={status} />
                  {expanded ? <ChevronDown aria-hidden="true" className="text-gray-500" size={18} /> : <ChevronRight aria-hidden="true" className="text-gray-500" size={18} />}
                </span>
              </button>

              {expanded && (
                <div className="grid gap-4 border-t border-gray-100 px-4 py-4 sm:grid-cols-[128px_minmax(0,1fr)]">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {payment.slipImageUrl ? (
                      <ImageWithSkeleton
                        alt={`หลักฐานการชำระงวด ${payment.installmentNumber}`}
                        className="size-full object-cover"
                        containerClassName="size-full"
                        src={payment.slipImageUrl}
                      />
                    ) : (
                      <ImageOff aria-hidden="true" className="text-gray-400" size={26} />
                    )}
                  </div>
                  <dl className="divide-y divide-gray-100 text-sm">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 pt-0"><dt className="text-gray-500">ส่งหลักฐาน</dt><dd className="font-medium text-gray-900">{valueOrDash(payment.paidAt)}</dd></div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2"><dt className="text-gray-500">ตรวจสอบเมื่อ</dt><dd className="font-medium text-gray-900">{valueOrDash(payment.reviewedAt)}</dd></div>
                    {status === "verified" ? (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 pb-0"><dt className="text-gray-500">ผลการตรวจสอบ</dt><dd className="font-medium text-emerald-700">Verified / ตรวจสอบเสร็จสิ้น</dd></div>
                    ) : status === "failed" ? (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 pb-0"><dt className="text-gray-500">เหตุผลจากผู้ดูแล</dt><dd className="max-w-[220px] text-right font-medium text-red-700">{valueOrDash(payment.reviewNote)}</dd></div>
                    ) : null}
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
