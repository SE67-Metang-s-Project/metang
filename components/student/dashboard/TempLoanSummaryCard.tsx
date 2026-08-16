import Link from "next/link";
import { tempLoanApplication, tempStudentProfile } from "@/app/student/temp/tempMockData";
import styles from "@/app/student/student.module.css";

export default function TempLoanSummaryCard() {
  return (
    <section className={styles.tempLoanSummary} aria-labelledby="temp-loan-summary-title">
      <div className={styles.tempSummaryIntro}>
        <h1 id="temp-loan-summary-title">สวัสดี, {tempStudentProfile.displayName}</h1>
        <p>
          {tempStudentProfile.programName} · {tempStudentProfile.yearLabel} ·{" "}
          {tempStudentProfile.studentId}
        </p>
      </div>
      <Link className={styles.tempLoanAction} href="/student/temp/apply">
        {tempLoanApplication.actionLabel}
      </Link>
    </section>
  );
}
