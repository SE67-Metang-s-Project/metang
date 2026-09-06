import { CalendarDays } from "lucide-react";
import type { InstallmentPayment } from "@/app/student/studentMockData";
import InstallmentCard from "./InstallmentCard";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type InstallmentListProps = {
  installments: InstallmentPayment[];
  onPay: (installment: InstallmentPayment) => void;
};

export default function InstallmentList({ installments, onPay }: InstallmentListProps) {
  const { t } = useStudentLanguage();
  return (
    <section className={styles.installmentsSection} aria-labelledby="installments-title">
      <header className={styles.sectionCardHeading}>
        <h2 id="installments-title">
          <CalendarDays aria-hidden="true" size={27} strokeWidth={2.2} />
          {t("รายการงวดชำระ", "Installments")}
        </h2>
      </header>
      <div className={styles.installmentsList}>
        {installments.map((installment) => (
          <InstallmentCard installment={installment} key={installment.installmentNumber} onPay={onPay} />
        ))}
      </div>
    </section>
  );
}
