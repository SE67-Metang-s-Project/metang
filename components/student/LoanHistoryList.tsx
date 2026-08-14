import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import LoanHistoryCard from "./LoanHistoryCard";
import styles from "@/app/student/student.module.css";

type LoanHistoryListProps = {
  requests: LoanRequestHistoryItem[];
  showAllRequests: boolean;
  onShowMore: () => void;
};

export default function LoanHistoryList({
  requests,
  showAllRequests,
  onShowMore,
}: LoanHistoryListProps) {
  const visibleRequests = showAllRequests ? requests : requests.slice(0, 3);
  const buttonLabel = showAllRequests
    ? "ซ่อนรายละเอียด"
    : "ดูประวัติคำร้องทั้งหมด";
  const iconClassName = [
    styles.showMoreIcon,
    showAllRequests ? styles.showMoreIconExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.historySection} aria-labelledby="history-title">
      <h2 id="history-title">ประวัติคำร้องกู้ยืม</h2>
      <div className={styles.historyList}>
        {visibleRequests.map((request, index) => (
          <LoanHistoryCard key={`${request.requestNumber}-${index}`} request={request} />
        ))}
      </div>

      {requests.length >= 3 ? (
        <button
          aria-expanded={showAllRequests}
          className={styles.showMore}
          onClick={onShowMore}
          type="button"
        >
          {buttonLabel}
          <span aria-hidden="true" className={iconClassName}>
            <i />
            <i />
          </span>
        </button>
      ) : null}
    </section>
  );
}
