import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanHistoryCardProps = {
  request: LoanRequestHistoryItem;
};

export default function LoanHistoryCard({ request }: LoanHistoryCardProps) {
  return (
    <article className={styles.historyCard}>
      <div>
        <div className={styles.historyCardTitle}>
          <strong>คำร้อง {request.requestNumber}</strong>
          <span className={`${styles.historyStatus} ${styles[request.statusType]}`}>
            {request.statusLabel}
          </span>
        </div>
        <p>{request.submittedAt}</p>
        <small>วัตถุประสงค์การกู้ยืม</small>
        <strong>ค่าเทอมภาคเรียนที่ 1/2569</strong>
      </div>
      <div className={styles.historyAmount}>
        <span>{request.amountLabel}</span>
        <strong>{request.amount}</strong>
      </div>
    </article>
  );
}
