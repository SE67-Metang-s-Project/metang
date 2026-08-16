import { tempPaymentBehavior } from "@/app/student/temp/tempMockData";
import styles from "@/app/student/student.module.css";

export default function TempPaymentBehaviorCard() {
  return (
    <section className={styles.tempPaymentBehavior} aria-label="พฤติกรรมการชำระ">
      <div className={styles.tempBehaviorHeading}>
        <h2>พฤติกรรมการชำระ</h2>
        <span className={styles.tempLateBadge}>
          <i aria-hidden="true" />
          {tempPaymentBehavior.lateStatusLabel}
        </span>
      </div>
      <div className={styles.tempBehaviorMetrics}>
        <p>
          กู้ยืมทั้งหมด {tempPaymentBehavior.totalLoanRequests} ครั้ง · แบ่งจ่ายจำนวน{" "}
          {tempPaymentBehavior.totalInstallments} งวด
        </p>
        <div className={styles.tempBehaviorStats}>
          <span className={styles.tempOnTimeBadge}>
            <i aria-hidden="true" />
            {tempPaymentBehavior.onTimeStatusLabel} {tempPaymentBehavior.onTimeInstallments} งวด
          </span>
          <span className={styles.tempLateStatBadge}>
            <i aria-hidden="true" />
            {tempPaymentBehavior.lateStatusLabel} {tempPaymentBehavior.lateInstallments} งวด
          </span>
        </div>
      </div>
    </section>
  );
}
