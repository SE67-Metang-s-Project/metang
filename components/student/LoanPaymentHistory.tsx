import type { LoanPaymentHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanPaymentHistoryProps = {
  items: LoanPaymentHistoryItem[];
};

export default function LoanPaymentHistory({ items }: LoanPaymentHistoryProps) {
  return (
    <section className={`${styles.loanDetailSection} ${styles.paymentHistorySection}`}>
      <h2>ประวัติหลักฐานการชำระ</h2>
      <div className={styles.paymentHistoryList}>
        {items.map((item) => (
          <article className={styles.paymentHistoryCard} key={item.installmentNumber}>
            <span aria-hidden="true" className={styles.paymentReceiptIcon}>
              ▧
            </span>
            <div className={styles.paymentHistoryContent}>
              <strong>
                งวดที่ {item.installmentNumber} · {item.amount}
              </strong>
              <p>{item.paidAt}</p>
              <p>{item.checkedAt}</p>
              <p>แนบหลักฐาน: ชำระผ่านธนาคาร</p>
            </div>
            <span className={styles.paymentVerifiedPill}>{item.statusLabel}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
