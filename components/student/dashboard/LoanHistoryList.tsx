import { History } from "lucide-react";
import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import LoanHistoryCard from "./LoanHistoryCard";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanHistoryListProps = {
  initialVisibleCount?: number;
  lessLabel?: string;
  moreLabel?: string;
  requests: LoanRequestHistoryItem[];
  sectionClassName?: string;
  showAllRequests: boolean;
  onShowMore: () => void;
  onCorrectRequest?: (requestNumber: string) => void;
  onOpenRequest?: (requestNumber: string) => void;
};

export default function LoanHistoryList({
  initialVisibleCount = 3,
  lessLabel,
  moreLabel,
  requests,
  sectionClassName,
  showAllRequests,
  onShowMore,
  onCorrectRequest,
  onOpenRequest,
}: LoanHistoryListProps) {
  const { t } = useStudentLanguage();
  const resolvedLessLabel = lessLabel ?? t("ซ่อนรายละเอียด", "Show less");
  const resolvedMoreLabel = moreLabel ?? t("ดูประวัติคำร้องทั้งหมด", "View all loan requests");
  const visibleRequests = showAllRequests
    ? requests
    : requests.slice(0, initialVisibleCount);
  const buttonLabel = showAllRequests ? resolvedLessLabel : resolvedMoreLabel;
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
          {t("ประวัติคำร้องกู้ยืม", "Loan request history")}
        </h2>
      </header>
      <div className={styles.historyList}>
        {visibleRequests.map((request, index) => (
          <LoanHistoryCard
            key={`${request.requestNumber}-${index}`}
            onCorrectRequest={onCorrectRequest}
            onOpenRequest={onOpenRequest}
            request={request}
          />
        ))}
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
