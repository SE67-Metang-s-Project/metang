"use client";

import type { ReactNode } from "react";
import { activeLoan, studentProfile } from "@/app/student/studentMockData";
import { useStudentEducationLevel } from "@/lib/student-education";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanSummaryCardProps = {
  onOpenDetails: () => void;
  medicalBag: ReactNode;
};

export default function LoanSummaryCard({ onOpenDetails, medicalBag }: LoanSummaryCardProps) {
  const { language, t } = useStudentLanguage();
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? studentProfile.educationLevel;
  const paidAmount = Number(activeLoan.paidAmount.replace(/,/g, ""));
  const totalAmount = Number(activeLoan.totalAmount.replace(/,/g, ""));
  const transferPercent = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

  return (
    <section className={styles.loanSummary} aria-labelledby="loan-summary-title">
      <div className={styles.summaryIntro}>
        <div>
          <h1 id="loan-summary-title">{t("สวัสดี", "Hello")}, {studentProfile.displayName}</h1>
          <p>
            {[studentProfile.programName, educationLevel, studentProfile.yearLabel, studentProfile.studentId]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {/* {medicalBag} */}
      </div>

      <div className={styles.loanLabels}>
        <span className={styles.loanRequestLabel}>{activeLoan.requestNumber}</span>
        <span className={styles.loanStatusLabel}>● {localizeStudentContent(activeLoan.statusLabel, language)}</span>
        <span aria-hidden="true" className={styles.loanBackLabel} />
      </div>

      <div className={styles.loanProgressCard}>
        <div className={styles.loanAmount}>
          <strong>{activeLoan.paidAmount}</strong>
          <span>/ {activeLoan.totalAmount}</span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${transferPercent}%` }} />
          <b style={{ left: `${transferPercent}%` }} />
        </div>
        <p>
          {t("ชำระงวดที่", "Pay installment")} {activeLoan.nextInstallmentNumber} {t("ก่อนวันที่", "by")} {localizeStudentContent(activeLoan.nextDueDate, language)}
        </p>
      </div>

      <div className={styles.summaryFooter}>
        <button onClick={onOpenDetails} type="button">
          {t("ดูรายละเอียดคำร้อง", "View request details")}
        </button>
        {/* <span>* ไม่สามารถยื่นคำร้องใหม่ได้ในขณะนี้</span> */}
      </div>
    </section>
  );
}
