import type { ReactNode } from "react";
import { paymentBehavior } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

type PaymentBehaviorCardProps = {
  moneyIllustration: ReactNode;
};

export default function PaymentBehaviorCard({ moneyIllustration }: PaymentBehaviorCardProps) {
  return (
    <section className={styles.paymentBehavior} aria-label="พฤติกรรมการชำระ">
      <div>
        <div className={styles.behaviorHeading}>
          <h2>พฤติกรรมการชำระ</h2>
          <span>● ชำระตรงเวลา {paymentBehavior.onTimeInstallments} งวด</span>
        </div>
        <p>
          กู้ยืมทั้งหมด {paymentBehavior.totalLoanRequests} ครั้ง · แบ่งจ่ายจำนวน {paymentBehavior.totalInstallments} งวด
        </p>
      </div>
      {moneyIllustration}
    </section>
  );
}
