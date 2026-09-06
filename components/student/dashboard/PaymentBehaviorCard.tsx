import { CreditCard } from "lucide-react";
import { paymentBehavior } from "@/app/student/studentMockData";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

export default function PaymentBehaviorCard() {
  const { t } = useStudentLanguage();
  return (
    <section className={styles.paymentBehavior} aria-label={t("พฤติกรรมการชำระเงิน", "Payment behavior")}>
      <header className={styles.behaviorHeading}>
        <h2>
          <CreditCard aria-hidden="true" size={27} strokeWidth={2.2} />
          {t("พฤติกรรมการชำระเงิน", "Payment behavior")}
        </h2>
        <span className={styles.behaviorStatus}>
          <i aria-hidden="true" />
          {t(paymentBehavior.onTimeStatusLabel, "Paid on time")}
        </span>
      </header>

      <div className={styles.behaviorStats}>
        <div className={styles.behaviorStat}>
          <span>{t("ประวัติกู้ยืม", "Loan history")}</span>
          <strong>{paymentBehavior.totalLoanRequests} {t("ครั้ง", "requests")}</strong>
        </div>
        <div className={`${styles.behaviorStat} ${styles.behaviorStatOnTime}`}>
          <span>{t("ตรงเวลา", "On time")}</span>
          <strong>{paymentBehavior.onTimeInstallments} {t("งวด", "installments")}</strong>
        </div>
        <div className={styles.behaviorStat}>
          <span>{t("ล่าช้า", "Late")}</span>
          <strong>{paymentBehavior.lateInstallments} {t("งวด", "installments")}</strong>
        </div>
      </div>
    </section>
  );
}
