import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanHistoryCardProps = {
  request: LoanRequestHistoryItem;
};

export default function LoanHistoryCard({ request }: LoanHistoryCardProps) {
  const [paidAmount, totalAmount] = request.amount.split("/");

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
        <strong>{request.purpose}</strong>
      </div>
      <div className={styles.historyAmount}>
        <span>{request.amountLabel}</span>
        <strong>
          {request.statusType === "pending" && totalAmount ? (
            <>
              {paidAmount.trim()}
              <span className={styles.historyAmountTotal}>/{totalAmount.trim()}</span>
            </>
          ) : (
            request.amount
          )}
        </strong>
      </div>
    </article>
  );
}
