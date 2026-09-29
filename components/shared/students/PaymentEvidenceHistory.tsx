"use client";

import React, { useMemo } from "react";
import LoanPaymentHistory from "@/components/student/loan-details/LoanPaymentHistory";
import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";

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

export default function PaymentEvidenceHistory({ payments = [] }: PaymentEvidenceHistoryProps) {
  const items: LoanPaymentHistoryItem[] = useMemo(() => {
    return payments.map((p, idx) => {
      const rawStatus = (p.status || "").toLowerCase();
      const status: LoanPaymentHistoryItem["status"] =
        rawStatus === "verified" || rawStatus === "confirmed" || rawStatus === "success"
          ? "verified"
          : rawStatus === "failed" || rawStatus === "rejected"
            ? "failed"
            : "checking";

      const formatAmount = (val: number | string) => {
        const str = String(val).replace(/,/g, "").trim();
        const num = Number(str.replace(/บาท/g, "").trim());
        return Number.isFinite(num) ? num.toLocaleString("th-TH") : String(val || "-");
      };

      return {
        id: p.id ?? `${p.installmentNumber}-${idx}`,
        installmentNumber: p.installmentNumber,
        amount: formatAmount(p.amount),
        receiptImage: p.slipImageUrl ?? "",
        paidAt: p.paidAt || "-",
        checkedAt: p.reviewedAt || "-",
        statusLabel: status === "verified" ? "ผ่าน" : status === "failed" ? "ไม่ผ่าน" : "ตรวจสอบ",
        status,
        reviewNote: p.reviewNote,
      };
    });
  }, [payments]);

  return <LoanPaymentHistory items={items} />;
}
