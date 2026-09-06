"use client";

import { Fragment, useState } from "react";
import { Check, CheckCircle2, Clock3, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LoanTimelineItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items?: LoanTimelineItem[];
  onShowTransferSlip?: () => void;
  confirmTransferLabel?: string;
  isTransferAccepted?: boolean;
  onConfirmTransfer?: () => void;
};

export default function LoanTimeline({
  items = [],
  onShowTransferSlip,
  confirmTransferLabel,
  isTransferAccepted = false,
  onConfirmTransfer,
}: LoanTimelineProps) {
  const router = useRouter();
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);
  const [isConfirmationSuccessOpen, setIsConfirmationSuccessOpen] = useState(false);
  const hasAcceptedTransfer = isTransferAccepted || isTransferConfirmed;
  const shouldShowConfirmation = !hasAcceptedTransfer && Boolean(confirmTransferLabel || onConfirmTransfer);
  const confirmationLabel = confirmTransferLabel ?? "ยืนยันการรับเงิน";

  const handleConfirmTransfer = () => {
    setIsTransferConfirmed(true);
    setIsConfirmationSuccessOpen(true);
    onConfirmTransfer?.();
  };

  const hasItems = items && items.length > 0;
  const hasActions = hasItems && Boolean(onShowTransferSlip || shouldShowConfirmation);

  return (
    <section
      aria-labelledby="loan-timeline-title"
      className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}
    >
      <header className={styles.sectionCardHeading}>
        <h2 id="loan-timeline-title">
          <Clock3 aria-hidden="true" size={23} strokeWidth={2.2} />
          ติดตามสถานะคำร้อง
        </h2>
      </header>
      {hasItems ? (
        <ol className={styles.loanTimeline}>
          {items.map((item) => (
            <li className={styles.loanTimelineItem} key={item.title}>
              <span aria-hidden="true" className={styles.timelineMarker} />
              <div className={styles.timelineContent}>
                <strong>{item.title}</strong>
                <p>
                  {item.dateTime} · โดย {item.actor}
                </p>
                {item.commentTitle && item.comment ? (
                  <section className={`${styles.detailDashboardCard} ${styles.timelineCommentCard}`}>
                    <header className={styles.sectionCardHeading}>
                      <h2>{item.commentTitle}</h2>
                    </header>
                    <p>{item.comment}</p>
                  </section>
                ) : null}
                {item.transferDetails ? (
                  <dl className={styles.transferDetails}>
                    {item.transferDetails.map((detail) => (
                      <Fragment key={detail}>
                        <dt>{detail.slice(0, detail.indexOf(":"))}</dt>
                        <dd>{detail.slice(detail.indexOf(":") + 1).trim()}</dd>
                      </Fragment>
                    ))}
                  </dl>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "#6b7280" }}>
          <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 500 }}>
            ไม่มีคำร้องขอกู้ยืมที่อยู่ระหว่างดำเนินการ
          </p>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            เมื่อท่านยื่นคำร้องกู้ยืม จะสามารถติดตามสถานะขั้นตอนการพิจารณาได้ที่นี่
          </span>
        </div>
      )}
      {hasActions ? (
        <div
          className={`${styles.loanTimelineActions} ${
            !shouldShowConfirmation ? styles.loanTimelineActionsSingle : ""
          }`}
        >
          {onShowTransferSlip ? (
            <button
              className={styles.outlineOrangeButton}
              onClick={onShowTransferSlip}
              type="button"
            >
              <FileText aria-hidden="true" size={18} />
              ดูหลักฐานการโอนเงิน
            </button>
          ) : null}
          {shouldShowConfirmation ? (
            <button className={styles.loanApplicationNext} onClick={handleConfirmTransfer} type="button">
              <Check aria-hidden="true" size={18} strokeWidth={3} />
              {confirmationLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {isConfirmationSuccessOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            aria-labelledby="transfer-confirmation-success-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="alertdialog"
          >
            <CheckCircle2 aria-hidden="true" className="mx-auto text-green-500" size={64} strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-bold text-gray-900" id="transfer-confirmation-success-title">
              ยืนยันการรับเงินสำเร็จ
            </h2>
            <p className="mt-2 text-sm text-gray-600">ระบบบันทึกการยืนยันของคุณเรียบร้อยแล้ว</p>
            <button
              className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => router.replace("/student")}
              type="button"
            >
              กลับสู่หน้าหลัก
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
