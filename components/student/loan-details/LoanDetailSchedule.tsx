"use client";

import { CalendarDays } from "lucide-react";
import type { LoanScheduleItem } from "@/app/student/studentMockData";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanDetailScheduleProps = {
  iconSize?: number;
  items?: LoanScheduleItem[];
};

export default function LoanDetailSchedule({ iconSize = 23, items = [] }: LoanDetailScheduleProps) {
  const { language, t } = useStudentLanguage();
  const hasItems = items && items.length > 0;

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.loanScheduleSection}`}>
      <header className={styles.sectionCardHeading}>
        <h2>
          <CalendarDays aria-hidden="true" size={iconSize} strokeWidth={2.2} />
          {t("ตารางการชำระ", "Repayment Schedule")}
        </h2>
      </header>
      {hasItems ? (
        <div className={styles.loanScheduleList}>
          {items.map((item) => (
            <div className={styles.loanScheduleRow} key={item.installmentNumber}>
              <strong>{t("งวด", "Inst.")} {item.installmentNumber}</strong>
              <span>{localizeStudentContent(item.dueDateLabel, language)}</span>
              <strong>{item.amount}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "#6b7280" }}>
          <p style={{ margin: "0 0 0.25rem 0", fontSize: "14px", fontWeight: 500 }}>
            {t("ยังไม่มีตารางการชำระเงิน", "No repayment schedule yet")}
          </p>
          <span style={{ color: "#9ca3af", fontSize: "14px" }}>
            {t("สถานะการพิจารณาจะแสดงที่นี่เมื่อมีการยื่นคำร้อง", "The schedule will appear after a request is submitted")}
          </span>
        </div>
      )}
    </section>
  );
}
