import { CalendarDays } from "lucide-react";
import type { LoanScheduleItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type LoanDetailScheduleProps = {
  items: LoanScheduleItem[];
};

export default function LoanDetailSchedule({ items }: LoanDetailScheduleProps) {
  const { language, t } = useStudentLanguage();
  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.loanScheduleSection}`}>
      <header className={styles.sectionCardHeading}>
        <h2>
          <CalendarDays aria-hidden="true" size={23} strokeWidth={2.2} />
          {t("ตารางการชำระ", "Repayment schedule")}
        </h2>
      </header>
      <div className={styles.loanScheduleList}>
        {items.map((item) => (
          <div className={styles.loanScheduleRow} key={item.installmentNumber}>
            <strong>{t("งวด", "Installment")} {item.installmentNumber}</strong>
            <span>{localizeStudentContent(item.dueDateLabel, language)}</span>
            <strong>{item.amount}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
