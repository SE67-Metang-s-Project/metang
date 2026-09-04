import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanHistoryCardProps = {
  onOpenRequest?: (requestNumber: string) => void;
  request: LoanRequestHistoryItem;
};

export default function LoanHistoryCard({ onOpenRequest, request }: LoanHistoryCardProps) {
  const [paidAmount, totalAmount] = request.amount.split("/");

  return (
    <article
      className={styles.historyCard}
      data-status={request.statusType}
      onClick={onOpenRequest ? () => onOpenRequest(request.requestNumber) : undefined}
      onKeyDown={
        onOpenRequest
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenRequest(request.requestNumber);
              }
            }
          : undefined
      }
      role={onOpenRequest ? "button" : undefined}
      tabIndex={onOpenRequest ? 0 : undefined}
    >
      <div>
        <div className={styles.historyCardTitle}>
          <strong>คำร้อง {request.requestNumber}</strong>
          <span className={`${styles.historyStatus} ${styles[request.statusType]}`}>
            ● {request.statusLabel}
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
