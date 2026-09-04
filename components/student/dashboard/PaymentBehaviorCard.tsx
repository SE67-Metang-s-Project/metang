import { CreditCard } from "lucide-react";
import { paymentBehavior } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

export default function PaymentBehaviorCard() {
  return (
    <section className={styles.paymentBehavior} aria-label="พฤติกรรมการชำระเงิน">
      <header className={styles.behaviorHeading}>
        <h2>
          <CreditCard aria-hidden="true" size={27} strokeWidth={2.2} />
          พฤติกรรมการชำระเงิน
        </h2>
        <span className={styles.behaviorStatus}>
          <i aria-hidden="true" />
          {paymentBehavior.onTimeStatusLabel}
        </span>
      </header>

      <div className={styles.behaviorStats}>
        <div className={styles.behaviorStat}>
          <span>ประวัติกู้ยืม</span>
          <strong>{paymentBehavior.totalLoanRequests} ครั้ง</strong>
        </div>
        <div className={`${styles.behaviorStat} ${styles.behaviorStatOnTime}`}>
          <span>ตรงเวลา</span>
          <strong>{paymentBehavior.onTimeInstallments} งวด</strong>
        </div>
        <div className={styles.behaviorStat}>
          <span>ล่าช้า</span>
          <strong>{paymentBehavior.lateInstallments} งวด</strong>
        </div>
      </div>
    </section>
  );
}
