"use client";

import { useState } from "react";
import { ReceiptText, X } from "lucide-react";
import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";
import StatusPill from "@/components/shared/StatusPill";
import styles from "@/app/student/student.module.css";

type LoanPaymentHistoryProps = {
  items: LoanPaymentHistoryItem[];
};

const paymentStatusTones = {
  verified: "success",
  checking: "warning",
  failed: "danger",
} as const;

export default function LoanPaymentHistory({ items }: LoanPaymentHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<LoanPaymentHistoryItem | null>(null);
  const paymentRecords = items
    .map((item, index) => {
      const recordsForInstallment = items.filter(
        (record) => record.installmentNumber === item.installmentNumber,
      );
      const attemptNumber = items
        .slice(0, index + 1)
        .filter((record) => record.installmentNumber === item.installmentNumber).length;

      return { item, attemptNumber, totalAttempts: recordsForInstallment.length };
    })
    .reverse();
  const selectedReceiptIndex = selectedReceipt ? items.indexOf(selectedReceipt) : -1;
  const selectedReceiptAttempts = selectedReceipt
    ? items.filter((item) => item.installmentNumber === selectedReceipt.installmentNumber)
    : [];
  const selectedReceiptAttemptNumber = selectedReceipt
    ? items
        .slice(0, selectedReceiptIndex + 1)
        .filter((item) => item.installmentNumber === selectedReceipt.installmentNumber).length
    : 0;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setSelectedReceipt(null);
  };

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.paymentHistorySection}`}>
      <header className={styles.sectionCardHeading}>
        <h2>
          <ReceiptText aria-hidden="true" size={23} strokeWidth={2.2} />
          ประวัติหลักฐานการชำระ
        </h2>
      </header>
      <div className={styles.paymentHistoryList}>
        {paymentRecords.map(({ item, attemptNumber, totalAttempts }) => (
          <button
            className={styles.paymentHistoryCard}
            key={`${item.installmentNumber}-${item.paidAt}`}
            onClick={() => setSelectedReceipt(item)}
            type="button"
          >
            <span aria-hidden="true" className={styles.paymentReceiptIcon}>
              <img alt="" src={item.receiptImage} />
            </span>
            <div className={styles.paymentHistoryContent}>
              <strong>
                งวดที่ {item.installmentNumber}
                {totalAttempts > 1 ? ` (ครั้งที่ ${attemptNumber})` : ""} · {item.amount}
              </strong>
              <p>{item.paidAt}</p>
              <p>{item.checkedAt}</p>
            </div>
            <span className={styles.paymentVerifiedPill}>
              <StatusPill label={item.statusLabel} tone={paymentStatusTones[item.status]} />
            </span>
          </button>
        ))}
      </div>
      {selectedReceipt ? (
        <div
          aria-label="หลักฐานการชำระเงิน"
          className={styles.transferSlipModalBackdrop}
          onMouseDown={handleBackdropClick}
          role="presentation"
        >
          <section aria-labelledby="payment-receipt-title" className={styles.transferSlipModal} role="dialog">
            <button
              aria-label="ปิดหลักฐานการชำระเงิน"
              className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setSelectedReceipt(null)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
            <h2 id="payment-receipt-title">
              หลักฐานการชำระงวดที่ {selectedReceipt.installmentNumber}
              {selectedReceiptAttempts.length > 1 ? ` (ครั้งที่ ${selectedReceiptAttemptNumber})` : ""}
            </h2>
            <div className={styles.transferSlipImageFrame}>
              <img alt="รูปหลักฐานการชำระเงิน" src={selectedReceipt.receiptImage} />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
