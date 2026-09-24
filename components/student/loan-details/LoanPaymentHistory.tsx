"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, ImageOff } from "lucide-react";
import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import TransferSlipModal from "./TransferSlipModal";

type LoanPaymentHistoryProps = {
  items: LoanPaymentHistoryItem[];
};

type PaymentEvidenceStatus = "verified" | "failed" | "pending";

function withoutTimestampLabel(value: string) {
  return value.replace(/^(?:ชำระเมื่อ|ส่งเมื่อ|ตรวจสอบเมื่อ|Paid|Sent|Verified)\s*/i, "");
}

function getPaymentStatus(status: LoanPaymentHistoryItem["status"]): PaymentEvidenceStatus {
  if (status === "verified") return "verified";
  if (status === "failed") return "failed";
  return "pending";
}

export default function LoanPaymentHistory({ items }: LoanPaymentHistoryProps) {
  const { language, t } = useStudentLanguage();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const verifiedCount = items.filter((item) => getPaymentStatus(item.status) === "verified").length;
  const failedCount = items.filter((item) => getPaymentStatus(item.status) === "failed").length;
  const pendingCount = items.filter((item) => getPaymentStatus(item.status) === "pending").length;
  const paymentRecords = items.map((item, index) => {
    const recordsForInstallment = items.filter((record) => record.installmentNumber === item.installmentNumber);
    const attemptNumber = items
      .slice(0, index + 1)
      .filter((record) => record.installmentNumber === item.installmentNumber).length;

    return { item, index, attemptNumber, totalAttempts: recordsForInstallment.length };
  });

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.paymentHistorySection}`}>
      <header className={styles.sectionCardHeading}>
        <h2>
          <FileText aria-hidden="true" size={23} strokeWidth={2.2} />
          {t("ประวัติหลักฐานการชำระ", "Payment Evidence History")}
        </h2>
      </header>

      <div className={styles.paymentEvidenceStats}>
        <PaymentStat count={verifiedCount} label={t("ผ่าน", "Verified")} status="verified" />
        <PaymentStat count={failedCount} label={t("ไม่ผ่าน", "Failed")} status="failed" />
        <PaymentStat count={pendingCount} label={t("ตรวจสอบ", "Pending")} status="pending" />
      </div>

      <div className={styles.paymentEvidenceTable}>
        {paymentRecords.length > 0 ? (
          paymentRecords.map(({ item, index, attemptNumber, totalAttempts }) => {
            const id = item.id ?? `${item.installmentNumber}-${index}`;
            const isExpanded = expandedIds.has(id);
            const status = getPaymentStatus(item.status);

            return (
              <article
                className={`${styles.paymentEvidenceRow} ${
                  isExpanded && status === "failed"
                    ? styles.paymentEvidenceRowFailed
                    : isExpanded && status === "verified"
                      ? styles.paymentEvidenceRowVerified
                      : ""
                }`}
                key={id}
              >
                <button
                  aria-expanded={isExpanded}
                  className={styles.paymentEvidenceRowButton}
                  onClick={() => {
                    setExpandedIds((currentIds) => {
                      const nextIds = new Set(currentIds);
                      if (nextIds.has(id)) {
                        nextIds.delete(id);
                      } else {
                        nextIds.add(id);
                      }
                      return nextIds;
                    });
                  }}
                  type="button"
                >
                  <span className={styles.paymentEvidenceInstallment}>
                    <strong>
                      {t("งวด", "Inst.")} {item.installmentNumber}
                    </strong>
                    {totalAttempts > 1 ? (
                      <span className={styles.paymentEvidenceAttempt}>
                        {language === "en" ? `(${attemptNumber})` : `(${t("ครั้งที่", "attempt")} ${attemptNumber})`}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.paymentEvidenceAmount}>{item.amount}</span>
                  <span className={styles.paymentEvidenceStatusCell}>
                    <PaymentStatus status={status} />
                    {isExpanded ? <ChevronDown aria-hidden="true" size={19} /> : <ChevronRight aria-hidden="true" size={19} />}
                  </span>
                </button>
                {isExpanded ? (
                  <div className={styles.paymentEvidenceExpanded}>
                    <div className={styles.paymentEvidenceReceipt}>
                      {item.receiptImage ? (
                        <button
                          aria-label={t("เปิดหลักฐานการชำระเงิน", "Open payment evidence")}
                          className={styles.paymentEvidenceReceiptButton}
                          onClick={() => setSelectedReceiptImage(item.receiptImage)}
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={t("รูปหลักฐานการชำระเงิน", "Payment evidence image")} src={item.receiptImage} />
                        </button>
                      ) : (
                        <ImageOff aria-hidden="true" size={28} />
                      )}
                    </div>
                    <dl className={styles.paymentEvidenceDetails}>
                      <div>
                        <dt>{t("ส่งหลักฐาน", "Submitted")}</dt>
                        <dd>{localizeStudentContent(withoutTimestampLabel(item.paidAt), language)}</dd>
                      </div>
                      <div>
                        <dt>{t("ตรวจสอบเมื่อ", "Reviewed")}</dt>
                        <dd>{localizeStudentContent(withoutTimestampLabel(item.checkedAt), language)}</dd>
                      </div>
                      {status === "failed" ? (
                        <div>
                          <dt>{t("เหตุผลจากผู้ดูแล", "Admin reason")}</dt>
                          <dd className={styles.paymentEvidenceFailedReason}>{item.reviewNote || "-"}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className={styles.paymentHistoryEmpty}>
            <span aria-hidden="true" className={styles.paymentHistoryEmptyIcon}>
              <FileText size={28} strokeWidth={1.8} />
            </span>
            <p>{t("ยังไม่มีประวัติการชำระเงิน", "No payment history yet")}</p>
          </div>
        )}
      </div>
      {selectedReceiptImage ? (
        <TransferSlipModal imageSrc={selectedReceiptImage} onClose={() => setSelectedReceiptImage(null)} />
      ) : null}
    </section>
  );
}

function PaymentStat({
  count,
  label,
  status,
}: {
  count: number;
  label: string;
  status: PaymentEvidenceStatus;
}) {
  return (
    <div className={`${styles.paymentEvidenceStat} ${styles[`paymentEvidenceStat${capitalize(status)}`]}`}>
      <span>
        <strong>{count}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

function PaymentStatus({ status }: { status: PaymentEvidenceStatus }) {
  const { t } = useStudentLanguage();
  const labels = {
    verified: t("ผ่าน", "Verified"),
    failed: t("ไม่ผ่าน", "Failed"),
    pending: t("สถานะตรวจสอบ", "Pending"),
  };

  return (
    <span className={`${styles.paymentEvidenceStatus} ${styles[`paymentEvidenceStatus${capitalize(status)}`]}`}>
      <span aria-hidden="true">●</span>
      {labels[status]}
    </span>
  );
}

function capitalize(value: string) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
