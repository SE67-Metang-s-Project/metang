"use client";

import { useState } from "react";
import type { InstallmentPayment, PaymentAccount } from "@/app/student/studentMockData";
import PaymentQrCode from "./PaymentQrCode";
import styles from "@/app/student/student.module.css";

type PaymentModalProps = {
  installment: InstallmentPayment;
  account: PaymentAccount;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PaymentModal({ installment, account, onClose, onConfirm }: PaymentModalProps) {
  const [fileName, setFileName] = useState("");

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      aria-label="หน้าต่างชำระเงิน"
      className={styles.paymentModalBackdrop}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section aria-labelledby="payment-modal-title" className={styles.paymentModal} role="dialog">
        <button
          aria-label="ปิดหน้าต่างชำระเงิน"
          className={styles.paymentModalClose}
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <header className={styles.paymentModalHeader}>
          <h2 id="payment-modal-title">ชำระงวดที่ {installment.installmentNumber}</h2>
          <p>
            ครบกำหนด {installment.dueDateLabel} · ค้างชำระ <strong>{installment.outstandingAmount}</strong>
          </p>
        </header>

        <hr className={styles.paymentModalDivider} />

        <section className={styles.paymentAccountSection}>
          <h3>
            <span aria-hidden="true">♜</span>
            ข้อมูลบัญชีสำหรับชำระเงิน
          </h3>
          <dl className={styles.paymentAccountList}>
            <div>
              <dt>{account.bankLabel}</dt>
              <dd>{account.bankName}</dd>
            </div>
            <div>
              <dt>{account.accountNameLabel}</dt>
              <dd>{account.accountName}</dd>
            </div>
            <div>
              <dt>{account.accountNumberLabel}</dt>
              <dd>
                {account.accountNumber}
                <button className={styles.copyAccountButton} type="button">
                  ▣ คัดลอก
                </button>
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.paymentQrSection}>
          <div className={styles.paymentProviderBanner}>{account.qrTitle}</div>
          <span className={styles.promptPayLabel}>PromptPay</span>
          <PaymentQrCode value={`${account.accountNumber}-${installment.installmentNumber}`} />
          <strong>สแกน QR เพื่อโอนเข้าบัญชี</strong>
          <p>ชื่อ: {account.qrRecipientName}</p>
          <p>บัญชี: {account.qrAccountName}</p>
          <small>เลขที่อ้างอิง: {account.qrReference}</small>
          <div className={styles.paymentBankNotice}>K+ &nbsp; Accepts all banks | รับเงินได้จากทุกธนาคาร</div>
        </section>

        <button className={styles.paymentSaveButton} onClick={onConfirm} type="button">
          บันทึก
        </button>

        <section className={styles.paymentUploadSection}>
          <h3>หลักฐานการโอนเงิน</h3>
          <label className={styles.paymentUploadBox} htmlFor="payment-receipt-upload">
            <span aria-hidden="true" className={styles.uploadIcon}>
              ↥
            </span>
            <strong>{fileName || "แตะเพื่ออัปโหลดหลักฐานการโอน"}</strong>
            <span>รองรับ JPG, PNG, PDF (สูงสุด 5 MB)</span>
            <input
              accept=".jpg,.jpeg,.png,.pdf"
              id="payment-receipt-upload"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              type="file"
            />
          </label>
          {fileName ? <p className={styles.paymentSelectedFile}>▧ {fileName}</p> : null}
        </section>

        <div className={styles.paymentModalActions}>
          <button className={styles.paymentCancelButton} onClick={onClose} type="button">
            ยกเลิก
          </button>
          <button className={styles.paymentConfirmButton} onClick={onConfirm} type="button">
            ยืนยัน
          </button>
        </div>
      </section>
    </div>
  );
}
