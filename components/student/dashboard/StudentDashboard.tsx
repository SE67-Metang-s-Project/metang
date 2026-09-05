"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  activeLoan,
  installmentPayments,
  loanRequestHistory,
  paymentAccount,
  studentProfile,
} from "@/app/student/studentMockData";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard from "./LoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import InstallmentList from "../payments/InstallmentList";
import PaymentModal from "@/components/shared/PaymentModal";
import type { InstallmentPayment } from "@/app/student/studentMockData";
import { MedicalBagIcon } from "./StudentIllustrations";
import ContactFooter from "../loan-details/ContactFooter";
import TopNav from "@/components/shared/TopNav";
import styles from "@/app/student/student.module.css";

export default function StudentDashboard() {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const preservedScrollPosition = useRef<number | null>(null);
  const router = useRouter();

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

  const openLoanDetails = (requestNumber: string) => {
    router.push(`/student/detail?request=${encodeURIComponent(requestNumber)}`);
  };

  const handlePaymentConfirmed = () => {
    setActivePayment(null);
    setIsPaymentSuccessOpen(true);
  };

  return (
    <main className={styles.studentPage}>
      <TopNav
        userName={studentProfile.displayName}
        userId={studentProfile.studentId}
        userRole="นักศึกษา"
        userEmail={`${studentProfile.studentId}@cmu.ac.th`}
        showSidebarButton={false}
      />

      <div className={styles.studentPageContent}>
        <div className={styles.studentContent}>
          <LoanSummaryCard
            medicalBag={<MedicalBagIcon />}
            onOpenDetails={() => openLoanDetails(activeLoan.requestNumber)}
          />
          <PaymentBehaviorCard />
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
      </div>

      {activePayment ? (
        <PaymentModal
          account={paymentAccount}
          installment={activePayment}
          onClose={() => setActivePayment(null)}
          onConfirm={handlePaymentConfirmed}
        />
      ) : null}

      {isPaymentSuccessOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            aria-labelledby="payment-success-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="alertdialog"
          >
            <CheckCircle2 aria-hidden="true" className="mx-auto text-green-500" size={64} strokeWidth={1.5} />
            <h2 className="mt-4 text-2xl font-bold text-gray-900" id="payment-success-title">
              ดำเนินการสำเร็จ!
            </h2>
            <p className="mt-2 text-gray-600">ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว</p>
            <p className="mt-1 text-sm text-gray-500">เจ้าหน้าที่จะตรวจสอบและแจ้งผลให้ทราบภายหลัง</p>
            <button
              className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => setIsPaymentSuccessOpen(false)}
              type="button"
            >
              ตกลง
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
