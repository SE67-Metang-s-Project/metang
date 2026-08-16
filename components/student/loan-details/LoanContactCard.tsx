import type { LoanContact } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type LoanContactCardProps = {
  contact: LoanContact;
};

export default function LoanContactCard({ contact }: LoanContactCardProps) {
  return (
    <section className={`${styles.loanDetailSection} ${styles.contactSection}`}>
      <h2>การจัดการคำร้อง</h2>
      <p className={styles.contactDescription}>กรุณาติดต่อเจ้าหน้าที่หากต้องการยกเลิกคำร้อง</p>
      <div className={styles.contactCard}>
        <h3>ติดต่อเจ้าหน้าที่</h3>
        <p>
          <span aria-hidden="true">⌕</span>
          {contact.phone}
        </p>
        <p>
          <span aria-hidden="true">✉</span>
          {contact.email}
          <span aria-hidden="true" className={styles.copyIcon}>
            ▣
          </span>
        </p>
        <p>
          <span aria-hidden="true">⌖</span>
          {contact.location}
        </p>
        <p>
          <span aria-hidden="true">◷</span>
          {contact.openingHours}
        </p>
      </div>
    </section>
  );
}
