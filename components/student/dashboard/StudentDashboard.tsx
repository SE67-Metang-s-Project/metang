"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  activeLoan,
  getLoanDetails,
  installmentPayments,
  loanRequestHistory,
  paymentAccount,
  studentProfile,
} from "@/app/student/studentMockData";
import LoanDetailsPage from "../loan-details/LoanDetailsPage";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard from "./LoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import InstallmentList from "../payments/InstallmentList";
import PaymentModal from "../payments/PaymentModal";
import type { InstallmentPayment } from "@/app/student/studentMockData";
import { MedicalBagIcon, MoneyIllustration } from "./StudentIllustrations";
import ContactFooter from "../loan-details/ContactFooter";
import styles from "@/app/student/student.module.css";

export default function StudentDashboard() {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "loan-details">("dashboard");
  const [activeRequestNumber, setActiveRequestNumber] = useState(activeLoan.requestNumber);
  const preservedScrollPosition = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (preservedScrollPosition.current === null) {
      return;
    }

    window.scrollTo(window.scrollX, preservedScrollPosition.current);
    preservedScrollPosition.current = null;
  }, [showAllRequests]);

  const toggleRequestHistory = () => {
    preservedScrollPosition.current = window.scrollY;
    setShowAllRequests((current) => !current);
  };

  const activeLoanDetails = getLoanDetails(activeRequestNumber);
  const openLoanDetails = (requestNumber: string) => {
    const loanDetails = getLoanDetails(requestNumber);

    if (loanDetails) {
      setActiveRequestNumber(requestNumber);
      setActiveView("loan-details");
    }
  };

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
            onShowMore={toggleRequestHistory}
            onOpenRequest={openLoanDetails}
            requests={loanRequestHistory}
            showAllRequests={showAllRequests}
          />
          <ContactFooter />
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
