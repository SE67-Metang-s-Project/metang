import type { LoanScheduleItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanDetailScheduleProps = {
  items: LoanScheduleItem[];
};

export default function LoanDetailSchedule({ items }: LoanDetailScheduleProps) {
  return (
    <section className={`${styles.loanDetailSection} ${styles.loanScheduleSection}`}>
      <h2>ตารางการชำระ</h2>
      <div className={styles.loanScheduleList}>
        {items.map((item) => (
          <div className={styles.loanScheduleRow} key={item.installmentNumber}>
            <strong>งวด {item.installmentNumber}</strong>
            <span>{item.dueDateLabel}</span>
            <strong>{item.amount}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
