"use client";

import Link from "next/link";
import { tempLoanApplication, tempStudentProfile } from "@/app/student/temp/tempMockData";
import { useStudentEducationLevel } from "@/lib/student-education";
import styles from "@/app/student/student.module.css";

import type { StudentProfileDisplay } from "./LoanSummaryCard";

type TempLoanSummaryCardProps = {
  profile?: StudentProfileDisplay;
};

export default function TempLoanSummaryCard({ profile }: TempLoanSummaryCardProps) {
  const currentProfile = profile ?? tempStudentProfile;
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? currentProfile.educationLevel;

  return (
    <section className={styles.tempLoanSummary} aria-labelledby="temp-loan-summary-title">
      <div className={styles.tempSummaryIntro}>
        <h1 id="temp-loan-summary-title">สวัสดี, {currentProfile.displayName}</h1>
        <p>
          {[currentProfile.programName, educationLevel, currentProfile.yearLabel, currentProfile.studentId]
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
