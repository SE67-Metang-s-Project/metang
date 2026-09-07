import { History } from "lucide-react";
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
  onShowMore: () => void;
  onOpenRequest?: (requestNumber: string) => void;
};

export default function LoanHistoryList({
  initialVisibleCount = 3,
  lessLabel = "ซ่อนรายละเอียด",
  moreLabel = "ดูประวัติคำร้องทั้งหมด",
  requests,
  sectionClassName,
  showAllRequests,
  onShowMore,
  onOpenRequest,
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
      <header className={styles.sectionCardHeading}>
        <h2 id="history-title">
          <History aria-hidden="true" size={27} strokeWidth={2.2} />
          ประวัติคำร้องกู้ยืม
        </h2>
      </header>
      <div className={styles.historyList}>
        {visibleRequests.length > 0 ? (
          visibleRequests.map((request, index) => (
            <LoanHistoryCard
              key={`${request.requestNumber}-${index}`}
              onOpenRequest={onOpenRequest}
              request={request}
            />
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem 0", fontSize: "0.95rem" }}>
            ยังไม่มีประวัติคำร้องกู้ยืม
          </p>
        )}
      </div>

      {requests.length > 3 ? (
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
