import type { InstallmentPayment, InstallmentStatus } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type InstallmentCardProps = {
  installment: InstallmentPayment;
  onPay: () => void;
};

function getStatusLabel(status: InstallmentStatus) {
  if (status === "paid") return "ชำระตรงเวลา";
  if (status === "current") return "ค้างชำระ";
  return "ชำระล่วงหน้า";
}

export default function InstallmentCard({ installment, onPay }: InstallmentCardProps) {
  const isUpcoming = installment.status === "upcoming";

  return (
    <article className={`${styles.installmentCard} ${styles[installment.status]}`}>
      <div className={styles.installmentHeading}>
        <div className={styles.installmentTitle}>
          <strong>งวดที่ {installment.installmentNumber}</strong>
          <span className={styles.statusPill}>{getStatusLabel(installment.status)}</span>
        </div>
        <div className={styles.installmentBalance}>
          <span>ค้างชำระ</span>
          <strong>{installment.outstandingAmount}</strong>
        </div>
      </div>

      <div className={styles.installmentDetails}>
        <div>
          <p>{installment.paidSummary}</p>
          <p>{installment.dueDate}</p>
        </div>
        <p className={styles.installmentNote}>
          <i />
          {installment.paymentNote}
        </p>
      </div>

      {installment.actionLabel ? (
        <button
          className={styles.installmentAction}
          disabled={isUpcoming}
          onClick={onPay}
          type="button"
        >
          {installment.actionLabel}
        </button>
      ) : null}
    </article>
  );
}
