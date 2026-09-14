"use client";

import { GraduationCap, Landmark } from "lucide-react";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import type { LoanDetails } from "@/app/student/studentMockData";
import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";
import styles from "@/app/student/student.module.css";

type TempDetailCardProps = {
  details: LoanDetails;
  profile: StudentProfileDisplay & { phoneNumber?: string };
};

const educationLevelsByStudentIdDigit: Record<string, string> = {
  "0": "ประกาศนียบัตรผู้ช่วยพยาบาล",
  "1": "ปริญญาตรี",
  "3": "ปริญญาโท",
  "5": "ปริญญาเอก",
};

export default function TempDetailCard({ details, profile }: TempDetailCardProps) {
  const { language, t } = useStudentLanguage();
  const educationLevel =
    educationLevelsByStudentIdDigit[profile.studentId.charAt(4)] ?? profile.educationLevel ?? "-";
  const displayName = language === "en" ? profile.displayNameEn || profile.displayName : profile.displayName;
  const programName = profile.programName || "พยาบาลศาสตรบัณฑิต";

  return (
    <>
      <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}>
        <header className={styles.sectionCardHeading}>
          <h2>
            <GraduationCap aria-hidden="true" size={23} strokeWidth={2.2} />
            {t("ข้อมูลนักศึกษา", "Student Information")}
          </h2>
        </header>
        <dl className={styles.loanDetailDefinitionList}>
          <div>
            <dt>{t("ชื่อ-นามสกุล", "Full name")}</dt>
            <dd>{displayName}</dd>
          </div>
          <div>
            <dt>{t("รหัสนักศึกษา", "Student ID")}</dt>
            <dd>{profile.studentId}</dd>
          </div>
          <div>
            <dt>{t("หลักสูตร", "Program")}</dt>
            <dd>{localizeStudentContent(programName, language)}</dd>
          </div>
          <div>
            <dt>{t("วุฒิการศึกษา", "Education level")}</dt>
            <dd>{localizeStudentContent(educationLevel, language)}</dd>
          </div>
          <div>
            <dt>{t("ชั้นปีการศึกษา", "Year of study")}</dt>
            <dd>{details.studentYear ? t(`ชั้นปีที่ ${details.studentYear}`, `Year ${details.studentYear}`) : "-"}</dd>
          </div>
          <div>
            <dt>{t("เบอร์โทรศัพท์", "Phone number")}</dt>
            <dd>{profile.phoneNumber || "-"}</dd>
          </div>
          <div>
            <dt>{t("อาจารย์ที่ปรึกษา", "Advisor")}</dt>
            <dd>{details.advisorName ? localizeStudentContent(details.advisorName, language) : "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}>
        <header className={styles.sectionCardHeading}>
          <h2>
            <Landmark aria-hidden="true" size={23} strokeWidth={2.2} />
            {t("ข้อมูลธนาคาร", "Bank Information")}
          </h2>
        </header>
        <dl className={styles.loanDetailDefinitionList}>
          <div>
            <dt>{t("ธนาคาร", "Bank")}</dt>
            <dd>{details.bankName ? localizeStudentContent(details.bankName, language) : "-"}</dd>
          </div>
          <div>
            <dt>{t("เลขที่บัญชี", "Account number")}</dt>
            <dd>{details.bankAccountNo || "-"}</dd>
          </div>
          <div className={styles.bankAccountNameRow}>
            <dt>{t("ชื่อบัญชี", "Account name")}</dt>
            <dd>{details.bankAccountName || "-"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
