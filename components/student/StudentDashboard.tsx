"use client";

import { useState } from "react";
import {
  activeLoan,
  getLoanDetails,
  installmentPayments,
  loanRequestHistory,
  paymentAccount,
  studentProfile,
} from "@/app/student/studentMockData";
import InstallmentList from "./InstallmentList";
import LoanDetailsPage from "./LoanDetailsPage";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard from "./LoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import PaymentModal from "./PaymentModal";
import type { InstallmentPayment } from "@/app/student/studentMockData";
import { MedicalBagIcon, MoneyIllustration } from "./StudentIllustrations";
import styles from "@/app/student/student.module.css";

export default function StudentDashboard() {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "loan-details">("dashboard");

  const activeLoanDetails = getLoanDetails(activeLoan.requestNumber);

  return (
    <main className={styles.studentPage}>
      {activeView === "loan-details" && activeLoanDetails ? (
        <LoanDetailsPage details={activeLoanDetails} onBack={() => setActiveView("dashboard")} />
      ) : (
        <div className={styles.studentContent}>
          <header className={styles.studentHeader}>
            <div className={styles.brandMark}>Metang LOGO</div>
            <div className={styles.profileMark}>{studentProfile.initials}</div>
          </header>

          <LoanSummaryCard
            medicalBag={<MedicalBagIcon />}
            onOpenDetails={() => setActiveView("loan-details")}
          />
          <PaymentBehaviorCard moneyIllustration={<MoneyIllustration />} />
          <InstallmentList
            installments={installmentPayments}
            onPay={setActivePayment}
          />
          <LoanHistoryList
            onShowMore={() => setShowAllRequests(true)}
            requests={loanRequestHistory}
            showAllRequests={showAllRequests}
          />
        </div>
      )}

      {activePayment ? (
        <PaymentModal
          account={paymentAccount}
          installment={activePayment}
          onClose={() => setActivePayment(null)}
          onConfirm={() => setActivePayment(null)}
        />
      ) : null}
    </main>
  );
}
