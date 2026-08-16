"use client";

import type { LoanTimelineItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items: LoanTimelineItem[];
  onShowTransferSlip: () => void;
  confirmTransferLabel?: string;
};

export default function LoanTimeline({
  items,
  onShowTransferSlip,
  confirmTransferLabel,
}: LoanTimelineProps) {
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
                    <li key={detail}>
                      {detail.includes(":") ? (
                        <>
                          <span>{detail.slice(0, detail.indexOf(":") + 1)}</span>
                          {detail.slice(detail.indexOf(":") + 1)}
                        </>
                      ) : (
                        detail
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.loanTimelineActions}>
        <button
          className={styles.outlineOrangeButton}
          onClick={onShowTransferSlip}
          type="button"
        >
          ดูหลักฐานการโอนเงิน
        </button>
        {confirmTransferLabel ? (
          <button className={styles.loanApplicationNext} type="button">
            {confirmTransferLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
