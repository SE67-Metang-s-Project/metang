import { CreditCard } from "lucide-react";
import { paymentBehavior as defaultPaymentBehavior } from "@/app/student/studentMockData";
import type { PaymentBehaviorDisplay } from "@/lib/student-view-model";
import styles from "@/app/student/student.module.css";

type PaymentBehaviorCardProps = {
  behavior?: PaymentBehaviorDisplay | null;
};

export default function PaymentBehaviorCard({ behavior }: PaymentBehaviorCardProps = {}) {
  // If explicitly null or 0 installments, do not render card
  if (behavior === null || (behavior && behavior.totalLoanRequests === 0)) {
    return null;
  }

  const currentBehavior = behavior ?? defaultPaymentBehavior;

  return (
    <section className={styles.paymentBehavior} aria-label="พฤติกรรมการชำระเงิน">
      <header className={styles.behaviorHeading}>
        <h2>
          <CreditCard aria-hidden="true" size={27} strokeWidth={2.2} />
          พฤติกรรมการชำระเงิน
        </h2>
        <span className={styles.behaviorStatus}>
          <i aria-hidden="true" />
          {currentBehavior.onTimeStatusLabel}
        </span>
      </header>

      <div className={styles.behaviorStats}>
        <div className={styles.behaviorStat}>
          <span>ประวัติกู้ยืม</span>
          <strong>{currentBehavior.totalLoanRequests} ครั้ง</strong>
        </div>
        <div className={`${styles.behaviorStat} ${styles.behaviorStatOnTime}`}>
          <span>ตรงเวลา</span>
          <strong>{currentBehavior.onTimeInstallments} งวด</strong>
        </div>
        <div className={styles.behaviorStat}>
          <span>ล่าช้า</span>
          <strong>{currentBehavior.lateInstallments} งวด</strong>
        </div>
      </div>
    </section>
  );
}

