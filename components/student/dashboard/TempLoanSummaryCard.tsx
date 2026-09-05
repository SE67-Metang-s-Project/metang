"use client";

import Link from "next/link";
import { tempLoanApplication, tempStudentProfile } from "@/app/student/temp/tempMockData";
import { useStudentEducationLevel } from "@/lib/student-education";
import styles from "@/app/student/student.module.css";

export default function TempLoanSummaryCard() {
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? tempStudentProfile.educationLevel;

  return (
    <section className={styles.tempLoanSummary} aria-labelledby="temp-loan-summary-title">
      <div className={styles.tempSummaryIntro}>
        <h1 id="temp-loan-summary-title">สวัสดี, {tempStudentProfile.displayName}</h1>
        <p>
          {[tempStudentProfile.programName, educationLevel, tempStudentProfile.yearLabel, tempStudentProfile.studentId]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Link className={styles.tempLoanAction} href="/student/loan/apply">
        {tempLoanApplication.actionLabel}
      </Link>
    </section>
  );
}
