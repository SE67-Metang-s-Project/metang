import type { InstallmentPayment, InstallmentStatus } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type InstallmentCardProps = {
  installment: InstallmentPayment;
  onPay: (installment: InstallmentPayment) => void;
};

function getStatusLabel(status: InstallmentStatus, language: "th" | "en") {
  if (status === "paid") return language === "th" ? "ชำระตรงเวลา" : "Paid on time";
  if (status === "current") return language === "th" ? "ค้างชำระ" : "Overdue";
  return language === "th" ? "ชำระล่วงหน้า" : "Upcoming";
}

export default function InstallmentCard({ installment, onPay }: InstallmentCardProps) {
  const { language, t } = useStudentLanguage();
  const isUpcoming = installment.status === "upcoming";
  const hasCompletedPayment =
    installment.completedPaymentLabel &&
    installment.completedPaymentDateLabel &&
    installment.completedPaymentTimeLabel;

  return (
    <article className={`${styles.installmentCard} ${styles[installment.status]}`}>
      <div className={styles.installmentHeading}>
        <div className={styles.installmentTitle}>
          <strong>{t("งวดที่", "Installment")} {installment.installmentNumber}</strong>
          {!isUpcoming ? (
            <span className={styles.statusPill}>● {getStatusLabel(installment.status, language)}</span>
          ) : null}
        </div>
        <div className={styles.installmentBalance}>
          <span>{t("ค้างชำระ", "Outstanding")}</span>
          <strong>{installment.outstandingAmount}</strong>
        </div>
      </div>

      <div className={styles.installmentDetails}>
        <div className={styles.installmentDetailGroup}>
          <p className={styles.installmentDetailLine}>
            <span>{t("ชำระแล้ว", "Paid")}</span>
            <span>{installment.paidAmountSummary}</span>
          </p>
          <p className={styles.installmentDetailLine}>
            <span>{t("ครบกำหนด", "Due")}</span>
            <span>{localizeStudentContent(installment.dueDateLabel, language)}</span>
          </p>
        </div>
        {hasCompletedPayment ? (
          <p className={`${styles.installmentNote} ${styles.completedPaymentNote}`}>
            <span className={styles.paymentNoteText}>
              <span className={styles.paymentNoteLabel}>
                <i aria-hidden="true" />
                <span>{localizeStudentContent(installment.completedPaymentLabel ?? "", language)}</span>
              </span>
              <span>
                {localizeStudentContent(installment.completedPaymentDateLabel ?? "", language)} {localizeStudentContent(installment.completedPaymentTimeLabel ?? "", language)}
              </span>
            </span>
          </p>
        ) : installment.paymentNote ? (
          <p className={styles.installmentNote}>
            <i aria-hidden="true" />
            <span className={styles.installmentNoteText}>{localizeStudentContent(installment.paymentNote ?? "", language)}</span>
          </p>
        ) : null}
      </div>

      {installment.actionLabel ? (
        <button
          className={styles.installmentAction}
          disabled={isUpcoming}
          onClick={() => onPay(installment)}
          type="button"
        >
          {installment.status === "current"
            ? t("ชำระงวดนี้ · คงเหลือ", "Pay this installment · Remaining") + ` ${installment.outstandingAmount}`
            : t("กรุณาดำเนินการชำระงวดก่อนหน้าให้เสร็จสิ้น", "Please complete the previous installment first")}
        </button>
      ) : null}
    </article>
  );
}
