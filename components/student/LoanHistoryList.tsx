import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import LoanHistoryCard from "./LoanHistoryCard";
import styles from "@/app/student/student.module.css";

type LoanHistoryListProps = {
  initialVisibleCount?: number;
  lessLabel?: string;
  moreLabel?: string;
  requests: LoanRequestHistoryItem[];
  sectionClassName?: string;
  showAllRequests: boolean;
  showMoreButton?: boolean;
  onShowMore: () => void;
};

export default function LoanHistoryList({
  initialVisibleCount = 3,
  lessLabel = "ซ่อนรายละเอียด",
  moreLabel = "ดูประวัติคำร้องทั้งหมด",
  requests,
  sectionClassName,
  showAllRequests,
  showMoreButton = false,
  onShowMore,
}: LoanHistoryListProps) {
  const visibleRequests = showAllRequests
    ? requests
    : requests.slice(0, initialVisibleCount);
  const buttonLabel = showAllRequests ? lessLabel : moreLabel;
  const iconClassName = [
    styles.showMoreIcon,
    showAllRequests ? styles.showMoreIconExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={[styles.historySection, sectionClassName].filter(Boolean).join(" ")}
      aria-labelledby="history-title"
    >
      <h2 id="history-title">ประวัติคำร้องกู้ยืม</h2>
      <div className={styles.historyList}>
        {visibleRequests.map((request, index) => (
          <LoanHistoryCard key={`${request.requestNumber}-${index}`} request={request} />
        ))}
      </div>

      {requests.length >= 3 || showMoreButton ? (
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
