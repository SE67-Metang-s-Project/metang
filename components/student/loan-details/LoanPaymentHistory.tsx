"use client";

import { useState } from "react";
import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanPaymentHistoryProps = {
  items: LoanPaymentHistoryItem[];
};

export default function LoanPaymentHistory({ items }: LoanPaymentHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<LoanPaymentHistoryItem | null>(null);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setSelectedReceipt(null);
  };

  return (
    <section className={`${styles.loanDetailSection} ${styles.paymentHistorySection}`}>
      <h2>ประวัติหลักฐานการชำระ</h2>
      <div className={styles.paymentHistoryList}>
        {[...items].reverse().map((item) => (
          <button
            className={styles.paymentHistoryCard}
            key={item.installmentNumber}
            onClick={() => setSelectedReceipt(item)}
            type="button"
          >
            <span aria-hidden="true" className={styles.paymentReceiptIcon}>
              <img alt="" src={item.receiptImage} />
            </span>
            <div className={styles.paymentHistoryContent}>
              <strong>
                งวดที่ {item.installmentNumber} · {item.amount}
              </strong>
              <p>{item.paidAt}</p>
              <p>{item.checkedAt}</p>
            </div>
            <span className={styles.paymentVerifiedPill}>{item.statusLabel}</span>
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
              className={styles.transferSlipModalClose}
              onClick={() => setSelectedReceipt(null)}
              type="button"
            >
              ×
            </button>
            <h2 id="payment-receipt-title">
              หลักฐานการชำระงวดที่ {selectedReceipt.installmentNumber}
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
