"use client";

import { useState } from "react";
import { installmentPayments, loanRequestHistory, studentProfile } from "@/app/student/studentMockData";
import InstallmentList from "./InstallmentList";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard from "./LoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import { MedicalBagIcon, MoneyIllustration } from "./StudentIllustrations";
import styles from "@/app/student/student.module.css";

export default function StudentDashboard() {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activeModal, setActiveModal] = useState<"request" | "payment" | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <main className={styles.studentPage}>
      <div className={styles.studentContent}>
        <header className={styles.studentHeader}>
          <div className={styles.brandMark}>Metang LOGO</div>
          <div className={styles.profileMark}>{studentProfile.initials}</div>
        </header>

        <LoanSummaryCard
          medicalBag={<MedicalBagIcon />}
          onOpenDetails={() => setActiveModal("request")}
        />
        <PaymentBehaviorCard moneyIllustration={<MoneyIllustration />} />
        <InstallmentList
          installments={installmentPayments}
          onPay={() => setActiveModal("payment")}
        />
        <LoanHistoryList
          onShowMore={() => setShowAllRequests(true)}
          requests={loanRequestHistory}
          showAllRequests={showAllRequests}
        />
      </div>

      {activeModal ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section aria-labelledby="modal-title" className={styles.modalCard} role="dialog">
            <button
              aria-label="ปิดหน้าต่าง"
              className={styles.modalClose}
              onClick={closeModal}
              type="button"
            >
              ×
            </button>
            <h2 id="modal-title">
              {activeModal === "payment" ? "ชำระงวดที่ 2" : "รายละเอียดคำร้อง SL-2568-0001"}
            </h2>
            <p>
              {activeModal === "payment"
                ? "ระบบจะพาไปยังขั้นตอนชำระเงินสำหรับยอดคงเหลือ ฿700"
                : "คำร้องกู้ยืมค่าเทอมภาคเรียนที่ 1/2569 อยู่ระหว่างชำระคืน"}
            </p>
            <button className={styles.modalPrimary} onClick={closeModal} type="button">
              เข้าใจแล้ว
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
