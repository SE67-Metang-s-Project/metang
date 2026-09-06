"use client";

import type { ReactNode } from "react";
import { activeLoan, studentProfile } from "@/app/student/studentMockData";
import { useStudentEducationLevel } from "@/lib/student-education";
import styles from "@/app/student/student.module.css";

export type ActiveLoanDisplay = {
  requestNumber: string;
  statusLabel: string;
  paidAmount: string;
  totalAmount: string;
  nextInstallmentNumber?: number | string;
  nextDueDate?: string;
  isDisbursed?: boolean;
};

export type StudentProfileDisplay = {
  displayName: string;
  studentId: string;
  educationLevel?: string;
  programName?: string;
  yearLabel?: string;
  contactEmail?: string;
};

type LoanSummaryCardProps = {
  onOpenDetails: () => void;
  medicalBag?: ReactNode;
  activeLoan?: ActiveLoanDisplay;
  profile?: StudentProfileDisplay;
};

export default function LoanSummaryCard({
  onOpenDetails,
  medicalBag,
  activeLoan: activeLoanProp,
  profile: profileProp,
}: LoanSummaryCardProps) {
  const currentLoan = activeLoanProp ?? activeLoan;
  const currentProfile = profileProp ?? studentProfile;
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? currentProfile.educationLevel;
  const paidAmount = Number(String(currentLoan.paidAmount).replace(/,/g, "")) || 0;
  const totalAmount = Number(String(currentLoan.totalAmount).replace(/,/g, "")) || 0;
  const transferPercent = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

  return (
    <section className={styles.loanSummary} aria-labelledby="loan-summary-title">
      <div className={styles.summaryIntro}>
        <div>
          <h1 id="loan-summary-title">สวัสดี, {currentProfile.displayName}</h1>
          <p>
            {[currentProfile.programName, educationLevel, currentProfile.yearLabel, currentProfile.studentId]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {medicalBag}
      </div>

      <div className={styles.loanLabels}>
        <span className={styles.loanRequestLabel}>{currentLoan.requestNumber}</span>
        <span className={styles.loanStatusLabel}>● {currentLoan.statusLabel}</span>
        <span aria-hidden="true" className={styles.loanBackLabel} />
      </div>

      <div className={styles.loanProgressCard}>
        <div className={styles.loanAmount}>
          <strong>{currentLoan.paidAmount}</strong>
          <span>/ {currentLoan.totalAmount}</span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${transferPercent}%` }} />
          <b style={{ left: `${transferPercent}%` }} />
        </div>
        <p>
          {"isDisbursed" in currentLoan && currentLoan.isDisbursed
            ? `ชำระงวดที่ ${currentLoan.nextInstallmentNumber ?? 1} ก่อนวันที่ ${currentLoan.nextDueDate ?? "-"}`
            : currentLoan.statusLabel}
        </p>
      </div>

      <div className={styles.summaryFooter}>
        <button onClick={onOpenDetails} type="button">
          ดูรายละเอียดคำร้อง
        </button>
        {/* <span>* ไม่สามารถยื่นคำร้องใหม่ได้ในขณะนี้</span> */}
      </div>
    </section>
  );
}
