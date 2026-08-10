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
  return (
    <section className={styles.historySection} aria-labelledby="history-title">
      <h2 id="history-title">ประวัติคำร้องกู้ยืม</h2>
      <div className={styles.historyList}>
        {requests.map((request, index) => (
          <LoanHistoryCard key={`${request.requestNumber}-${index}`} request={request} />
        ))}
      </div>

      {showAllRequests ? (
        <p className={styles.moreHistory}>ไม่พบรายการเพิ่มเติม</p>
      ) : (
        <button className={styles.showMore} onClick={onShowMore} type="button">
          ดูเพิ่มเติม
        </button>
      )}
    </section>
  );
}
