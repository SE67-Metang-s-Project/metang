"use client";

import { History } from "lucide-react";
import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
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
  const { t } = useStudentLanguage();
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
          {t("ประวัติคำร้องกู้ยืม", "Loan History")}
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
          <div className={styles.emptyDashboardState}>
            <span aria-hidden="true" className={styles.emptyDashboardStateIcon}>
              <History size={24} strokeWidth={2} />
            </span>
            <p>{t("ยังไม่มีประวัติคำร้องกู้ยืม", "No loan history yet")}</p>
            <span>{t("ประวัติคำร้องจะแสดงที่นี่เมื่อมีการยื่นคำร้อง", "History appears after submission")}</span>
          </div>
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
