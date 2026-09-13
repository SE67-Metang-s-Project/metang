"use client";

import { CreditCard } from "lucide-react";
import { paymentBehavior as defaultPaymentBehavior } from "@/app/student/studentMockData";
import type { PaymentBehaviorDisplay } from "@/lib/student-view-model";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type PaymentBehaviorCardProps = {
  behavior?: PaymentBehaviorDisplay | null;
};

export default function PaymentBehaviorCard({ behavior }: PaymentBehaviorCardProps = {}) {
  const { language, t } = useStudentLanguage();
  const currentBehavior = behavior ?? {
    ...defaultPaymentBehavior,
    hasHistory: true,
  };

  const isLate = currentBehavior.hasHistory && currentBehavior.lateInstallments > 0;

  const statusBadgeStyle = isLate
    ? {
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        color: "#dc2626",
      }
    : undefined;

  return (
    <section className={styles.paymentBehavior} aria-label={t("พฤติกรรมการชำระเงิน", "Payment Behavior")}>
      <header className={styles.behaviorHeading}>
        <h2>
          <CreditCard aria-hidden="true" size={27} strokeWidth={2.2} />
          {t("พฤติกรรมการชำระเงิน", "Payment Behavior")}
        </h2>
        {currentBehavior.hasHistory ? (
          <span className={styles.behaviorStatus} style={statusBadgeStyle}>
            <i aria-hidden="true" />
            {localizeStudentContent(currentBehavior.onTimeStatusLabel, language)}
          </span>
        ) : null}
      </header>

        <div className={styles.behaviorStats}>
          <div className={styles.behaviorStat}>
            <span>{t("ประวัติกู้ยืม", "Loan history")}</span>
            <strong>{currentBehavior.totalLoanRequests}</strong>
            <small>{t("ครั้ง", "requests")}</small>
        </div>
        <div
          className={`${styles.behaviorStat} ${
            currentBehavior.hasHistory && currentBehavior.onTimeInstallments > 0
              ? styles.behaviorStatOnTime
              : ""
          }`}
        >
          <span>{t("ตรงเวลา", "On time")}</span>
          <strong>{currentBehavior.onTimeInstallments}</strong>
          <small>{t("งวด", "installments")}</small>
        </div>
        <div className={styles.behaviorStat}>
          <span>{t("ล่าช้า", "Late")}</span>
          <strong>{currentBehavior.lateInstallments}</strong>
          <small>{t("งวด", "installments")}</small>
        </div>
      </div>
    </section>
  );
}
