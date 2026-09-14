"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { activeLoan, studentProfile } from "@/app/student/studentMockData";
import { useStudentEducationLevel } from "@/lib/student-education";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

export type ActiveLoanDisplay = {
  id?: string;
  status?: string;
  requestNumber: string;
  statusLabel: string;
  paidAmount: string;
  totalAmount: string;
  nextInstallmentNumber?: number | string;
  nextDueDate?: string;
  isDisbursed?: boolean;
  transferSlipImage?: string;
};

export type StudentProfileDisplay = {
  displayName: string;
  displayNameEn?: string;
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

function getProgramLabel(programName: string | undefined, language: "th" | "en") {
  const program = programName?.trim() ?? "";
  const isNursingProgram = program.includes("พยาบาลศาสตรบัณฑิต");
  const isInternationalProgram = program.includes("นานาชาติ") || /international/i.test(program);

  if (!isNursingProgram) return localizeStudentContent(program, language);

  if (language === "en") {
    return isInternationalProgram
      ? "Bachelor of Nursing Science Program (International Program)"
      : "Bachelor of Nursing Science Program";
  }

  return isInternationalProgram
    ? "หลักสูตรพยาบาลศาสตรบัณฑิต (หลักสูตรนานาชาติ)"
    : "หลักสูตรพยาบาลศาสตรบัณฑิต";
}

export default function LoanSummaryCard({
  onOpenDetails,
  medicalBag,
  activeLoan: activeLoanProp,
  profile: profileProp,
}: LoanSummaryCardProps) {
  const router = useRouter();
  const { language, t } = useStudentLanguage();
  const currentLoan = activeLoanProp ?? activeLoan;
  const currentProfile: StudentProfileDisplay = profileProp ?? studentProfile;
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? currentProfile.educationLevel;
  const programLabel = getProgramLabel(currentProfile.programName, language);
  const profileMeta = [educationLevel, currentProfile.yearLabel, currentProfile.studentId]
    .map((value) => (value ? localizeStudentContent(value, language) : value))
    .filter(Boolean)
    .join(" | ");
  const paidAmount = Number(String(currentLoan.paidAmount).replace(/,/g, "")) || 0;
  const totalAmount = Number(String(currentLoan.totalAmount).replace(/,/g, "")) || 0;
  const transferPercent = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
  const isReturned =
    currentLoan.statusLabel.includes("แก้ไข") ||
    ("status" in currentLoan && currentLoan.status === "returned");

  return (
    <section className={styles.loanSummary} aria-labelledby="loan-summary-title">
      <div className={styles.summaryIntro}>
        <div>
          <h1 id="loan-summary-title">
            {t("สวัสดี", "HELLO")}, {language === "en" ? currentProfile.displayNameEn || currentProfile.displayName : currentProfile.displayName}
          </h1>
          <div className={styles.summaryProfileDetails}>
            {programLabel ? <p>{programLabel}</p> : null}
            {profileMeta ? <p>{profileMeta}</p> : null}
          </div>
        </div>
        {/* {medicalBag} */}
      </div>

      <div className={styles.loanLabels}>
        <span className={styles.loanRequestLabel}>{currentLoan.requestNumber}</span>
        <span
          className={`${styles.loanStatusLabel} ${"status" in currentLoan && currentLoan.status === "draft" ? styles.loanStatusDraft : ""} ${language === "en" ? styles.studentEnglishStatus : ""}`}
        >
          ● {localizeStudentContent(currentLoan.statusLabel, language)}
        </span>
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
      </div>

      <div className={styles.summaryFooter}>
        <button onClick={onOpenDetails} type="button">
          {t("ดูรายละเอียดคำร้อง", "View request details")}
        </button>
        {isReturned ? (
          <button
            onClick={() => router.push("/student/loan/apply")}
            type="button"
            style={{
              backgroundColor: "#d97706",
              color: "#ffffff",
              borderRadius: "10px",
              padding: "12px",
              fontWeight: 600,
              border: 0,
              cursor: "pointer",
            }}
          >
            {t("แก้ไขคำร้อง", "Edit request")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
