"use client";

import type { LoanTimelineItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items: LoanTimelineItem[];
  onShowTransferSlip: () => void;
};

export default function LoanTimeline({ items, onShowTransferSlip }: LoanTimelineProps) {
  return (
    <section className={styles.loanDetailSection} aria-labelledby="loan-timeline-title">
      <h2 id="loan-timeline-title">ไทม์ไลน์สถานะคำร้อง</h2>
      <ol className={styles.loanTimeline}>
        {items.map((item) => (
          <li className={styles.loanTimelineItem} key={item.title}>
            <span aria-hidden="true" className={styles.timelineMarker} />
            <div className={styles.timelineContent}>
              <strong>{item.title}</strong>
              <p>
                {item.dateTime} · โดย {item.actor}
              </p>
              {item.transferDetails ? (
                <ul className={styles.transferDetails}>
                  {item.transferDetails.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <button
        className={styles.outlineOrangeButton}
        onClick={onShowTransferSlip}
        type="button"
      >
        ดูหลักฐานการโอนเงิน
      </button>
    </section>
  );
}
