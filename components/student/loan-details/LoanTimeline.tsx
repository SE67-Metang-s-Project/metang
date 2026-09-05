"use client";

import { Fragment } from "react";
import { Clock3, FileText } from "lucide-react";
import type { LoanTimelineItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items: LoanTimelineItem[];
  onShowTransferSlip: () => void;
  confirmTransferLabel?: string;
  isTransferAccepted?: boolean;
  onConfirmTransfer?: () => void;
};

export default function LoanTimeline({
  items,
  onShowTransferSlip,
  confirmTransferLabel,
  isTransferAccepted = false,
  onConfirmTransfer,
}: LoanTimelineProps) {
  const shouldShowConfirmation = !isTransferAccepted && Boolean(confirmTransferLabel || onConfirmTransfer);
  const confirmationLabel = confirmTransferLabel ?? "ยืนยันการรับเงิน";

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
      <div
        className={`${styles.loanTimelineActions} ${
          !shouldShowConfirmation ? styles.loanTimelineActionsSingle : ""
        }`}
      >
        <button
          className={styles.outlineOrangeButton}
          onClick={onShowTransferSlip}
          type="button"
        >
          <FileText aria-hidden="true" size={18} />
          ดูหลักฐานการโอนเงิน
        </button>
        {shouldShowConfirmation ? (
          <button className={styles.loanApplicationNext} onClick={onConfirmTransfer} type="button">
            {confirmationLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
