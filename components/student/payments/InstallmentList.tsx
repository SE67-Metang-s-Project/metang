import type { InstallmentPayment } from "@/app/student/studentMockData";
import InstallmentCard from "./InstallmentCard";
import styles from "@/app/student/student.module.css";

type InstallmentListProps = {
  installments: InstallmentPayment[];
  onPay: (installment: InstallmentPayment) => void;
};

export default function InstallmentList({ installments, onPay }: InstallmentListProps) {
  return (
    <section className={styles.installmentsSection} aria-labelledby="installments-title">
      <h2 id="installments-title">รายการงวดชำระ</h2>
      <div className={styles.installmentsList}>
        {installments.map((installment) => (
          <InstallmentCard installment={installment} key={installment.installmentNumber} onPay={onPay} />
        ))}
      </div>
    </section>
  );
}
