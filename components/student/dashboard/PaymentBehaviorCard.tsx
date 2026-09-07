import { CreditCard } from "lucide-react";
import { paymentBehavior as defaultPaymentBehavior } from "@/app/student/studentMockData";
import type { PaymentBehaviorDisplay } from "@/lib/student-view-model";
import styles from "@/app/student/student.module.css";

type PaymentBehaviorCardProps = {
  behavior?: PaymentBehaviorDisplay | null;
};

export default function PaymentBehaviorCard({ behavior }: PaymentBehaviorCardProps = {}) {
  const currentBehavior = behavior ?? {
    ...defaultPaymentBehavior,
    hasHistory: true,
  };

  const isNeutral = !currentBehavior.hasHistory;
  const isLate = currentBehavior.hasHistory && currentBehavior.lateInstallments > 0;

  const statusBadgeStyle = isNeutral
    ? {
        borderColor: "#cbd5e1",
        backgroundColor: "#f1f5f9",
        color: "#475569",
      }
    : isLate
    ? {
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        color: "#dc2626",
      }
    : undefined;

  return (
    <section className={styles.paymentBehavior} aria-label="พฤติกรรมการชำระเงิน">
      <header className={styles.behaviorHeading}>
        <h2>
          <CreditCard aria-hidden="true" size={27} strokeWidth={2.2} />
          พฤติกรรมการชำระเงิน
        </h2>
        <span className={styles.behaviorStatus} style={statusBadgeStyle}>
          <i aria-hidden="true" />
          {currentBehavior.onTimeStatusLabel}
        </span>
      </header>

      <div className={styles.behaviorStats}>
        <div className={styles.behaviorStat}>
          <span>ประวัติกู้ยืม</span>
          <strong>{currentBehavior.totalLoanRequests} ครั้ง</strong>
        </div>
        <div
          className={`${styles.behaviorStat} ${
            currentBehavior.hasHistory && currentBehavior.onTimeInstallments > 0
              ? styles.behaviorStatOnTime
              : ""
          }`}
        >
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
