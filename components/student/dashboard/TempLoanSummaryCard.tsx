"use client";

import Link from "next/link";
import { tempLoanApplication, tempStudentProfile } from "@/app/student/temp/tempMockData";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { useStudentEducationLevel } from "@/lib/student-education";
import styles from "@/app/student/student.module.css";

import type { StudentProfileDisplay } from "./LoanSummaryCard";

type TempLoanSummaryCardProps = {
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

export default function TempLoanSummaryCard({ profile }: TempLoanSummaryCardProps) {
  const { language, t } = useStudentLanguage();
  const currentProfile: StudentProfileDisplay = profile ?? tempStudentProfile;
  const savedEducationLevel = useStudentEducationLevel();
  const educationLevel = savedEducationLevel ?? currentProfile.educationLevel;
  const programLabel = getProgramLabel(currentProfile.programName, language);
  const profileMeta = [educationLevel, currentProfile.yearLabel, currentProfile.studentId]
    .map((value) => (value ? localizeStudentContent(value, language) : value))
    .filter(Boolean)
    .join(" | ");

  return (
    <section className={styles.tempLoanSummary} aria-labelledby="temp-loan-summary-title">
      <div className={styles.tempSummaryIntro}>
        <h1 id="temp-loan-summary-title">
          {t("สวัสดี", "HELLO")}, {language === "en"
            ? currentProfile.displayNameEn || currentProfile.displayName
            : currentProfile.displayName}
        </h1>
        <div className={styles.summaryProfileDetails}>
          {programLabel ? <p>{programLabel}</p> : null}
          {profileMeta ? <p>{profileMeta}</p> : null}
        </div>
      </div>
      <Link className={styles.tempLoanAction} href="/student/loan/apply">
        {t(tempLoanApplication.actionLabel, "Submit a loan request")}
      </Link>
    </section>
  );
}
