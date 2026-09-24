"use client";

import { useState } from "react";
import { ReceiptText, X } from "lucide-react";
import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";
import StatusPill from "@/components/shared/StatusPill";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";

type LoanPaymentHistoryProps = {
  items: LoanPaymentHistoryItem[];
};

const paymentStatusClassNames = {
  verified: styles.completed,
  checking: styles.revisionRequired,
  failed: styles.rejectedExecutive,
} as const;

function withoutTimestampLabel(value: string) {
  return value.replace(/^(?:ชำระเมื่อ|ส่งเมื่อ|ตรวจสอบเมื่อ|Paid|Sent|Verified)\s*/i, "");
}

export default function LoanPaymentHistory({ items }: LoanPaymentHistoryProps) {
  const { language, t } = useStudentLanguage();
  const [selectedReceipt, setSelectedReceipt] = useState<LoanPaymentHistoryItem | null>(null);
  const verifiedCount = items.filter((item) => item.status === "verified").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const paymentRecords = items
    .map((item, index) => {
      const recordsForInstallment = items.filter(
        (record) => record.installmentNumber === item.installmentNumber,
      );
      const attemptNumber = items
        .slice(0, index + 1)
        .filter((record) => record.installmentNumber === item.installmentNumber).length;

      return { item, index, attemptNumber, totalAttempts: recordsForInstallment.length };
    });
  const selectedReceiptIndex = selectedReceipt ? items.indexOf(selectedReceipt) : -1;
  const selectedReceiptAttempts = selectedReceipt
    ? items.filter((item) => item.installmentNumber === selectedReceipt.installmentNumber)
    : [];
  const selectedReceiptAttemptNumber = selectedReceipt
    ? items
        .slice(0, selectedReceiptIndex + 1)
        .filter((item) => item.installmentNumber === selectedReceipt.installmentNumber).length
    : 0;

  const backdropDismiss = useModalDismiss({
    onClose: () => setSelectedReceipt(null),
    isOpen: Boolean(selectedReceipt),
  });

  const paymentHistoryList = (
    <div className={styles.paymentHistoryList}>
      {paymentRecords.length > 0 ? (
        paymentRecords.map(({ item, index, attemptNumber, totalAttempts }) => (
          <button
            className={styles.paymentHistoryCard}
            key={item.id ?? `${item.installmentNumber}-${index}`}
            onClick={() => setSelectedReceipt(item)}
            type="button"
          >
            <span aria-hidden="true" className={styles.paymentReceiptIcon}>
              {item.receiptImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={item.receiptImage} />
              ) : (
                <ReceiptText size={20} strokeWidth={1.8} />
              )}
            </span>
            <div className={styles.paymentHistoryContent}>
              <strong>
                {t("งวด", "Inst.")} {item.installmentNumber}
                {totalAttempts > 1 ? ` (${t("ครั้งที่", "attempt")} ${attemptNumber})` : ""} · {item.amount}
              </strong>
              <p>
                {t("ส่งเมื่อ", "Sent")} {localizeStudentContent(withoutTimestampLabel(item.paidAt), language)}
              </p>
              <p>
                {t("ตรวจสอบเมื่อ", "Verified")} {localizeStudentContent(withoutTimestampLabel(item.checkedAt), language)}
              </p>
              {item.reviewNote ? (
                <p>
                  {t("เหตุผล", "Reason")}: {item.reviewNote}
                </p>
              ) : null}
            </div>
            <span className={styles.paymentVerifiedPill}>
              <StatusPill
                className={paymentStatusClassNames[item.status]}
                label={localizeStudentContent(item.statusLabel, language)}
                tone="neutral"
              />
            </span>
          </button>
        ))
      ) : (
        <div className={styles.paymentHistoryEmpty}>
          <span className={styles.paymentHistoryEmptyIcon}>
            <ReceiptText aria-hidden="true" size={28} strokeWidth={1.8} />
          </span>
          <p>{t("ยังไม่มีประวัติการชำระเงิน", "No payment history yet")}</p>
        </div>
      )}
    </div>
  );

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.paymentHistorySection}`}>
      <header className={styles.sectionCardHeading}>
        <h2>
          <ReceiptText aria-hidden="true" size={23} strokeWidth={2.2} />
          {t("ประวัติหลักฐานการชำระ", "Payment Evidence History")}
        </h2>
      </header>
      {paymentHistoryList}
      {items.length > 0 ? (
        <p className={styles.paymentHistorySummary}>
          {t("ผ่านการตรวจสอบ", "Verified")} {verifiedCount} ·{" "}
          {t("ไม่ผ่านการตรวจสอบ", "Failed")} {failedCount}
        </p>
      ) : null}
      {selectedReceipt ? (
        <div
          aria-label={t("หลักฐานการชำระเงิน", "Payment evidence")}
          className={styles.transferSlipModalBackdrop}
          {...backdropDismiss}
          role="presentation"
        >
          <section
            aria-labelledby="payment-receipt-title"
            className={`${styles.transferSlipModal} ${styles.paymentEvidenceModal}`}
            role="dialog"
          >
            <button
              aria-label={t("ปิดหลักฐานการชำระเงิน", "Close payment evidence")}
              className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setSelectedReceipt(null)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
            <h2 id="payment-receipt-title">
              {t("หลักฐานการชำระงวด", "Payment evidence — Inst.")} {selectedReceipt.installmentNumber}
              {selectedReceiptAttempts.length > 1 ? ` (${t("ครั้งที่", "attempt")} ${selectedReceiptAttemptNumber})` : ""}
            </h2>
            <div className={`${styles.transferSlipImageFrame} ${styles.paymentEvidenceImageFrame}`}>
              {selectedReceipt.receiptImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={t("รูปหลักฐานการชำระเงิน", "Payment evidence image")} src={selectedReceipt.receiptImage} />
              ) : (
                <p>{t("ไม่มีไฟล์หลักฐาน", "No evidence file")}</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
