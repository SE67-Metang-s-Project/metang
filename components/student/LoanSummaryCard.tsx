import type { ReactNode } from "react";
import { activeLoan, studentProfile } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanSummaryCardProps = {
  onOpenDetails: () => void;
  medicalBag: ReactNode;
};

export default function LoanSummaryCard({ onOpenDetails, medicalBag }: LoanSummaryCardProps) {
  return (
    <section className={styles.loanSummary} aria-labelledby="loan-summary-title">
      <div className={styles.summaryIntro}>
        <div>
          <h1 id="loan-summary-title">สวัสดี, {studentProfile.displayName}</h1>
          <p>
            {studentProfile.programName} · {studentProfile.yearLabel} · {studentProfile.studentId}
          </p>
        </div>
        {/* {medicalBag} */}
      </div>

      <div className={styles.loanLabels}>
        <span>{activeLoan.requestNumber}</span>
        <span>● {activeLoan.statusLabel}</span>
      </div>

      <div className={styles.loanProgressCard}>
        <div className={styles.loanAmount}>
          <strong>{activeLoan.paidAmount}</strong>
          <span>/ {activeLoan.totalAmount}</span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${activeLoan.progressPercent}%` }} />
          <b style={{ left: `${activeLoan.progressPercent}%` }} />
        </div>
        <p>ชำระงวดที่ 2 ก่อนวันที่ {activeLoan.nextDueDate}</p>
      </div>

      <div className={styles.summaryFooter}>
        <button onClick={onOpenDetails} type="button">
          ดูรายละเอียดคำร้อง
        </button>
        <span>* ไม่สามารถยื่นคำร้องใหม่ได้ในขณะนี้</span>
      </div>
    </section>
  );
}
