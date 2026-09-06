"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  activeLoan as defaultActiveLoan,
  installmentPayments as defaultInstallmentPayments,
  loanRequestHistory as defaultLoanRequestHistory,
  paymentAccount,
  studentProfile as defaultStudentProfile,
} from "@/app/student/studentMockData";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard, { type ActiveLoanDisplay, type StudentProfileDisplay } from "./LoanSummaryCard";
import TempLoanSummaryCard from "./TempLoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import InstallmentList from "../payments/InstallmentList";
import PaymentModal from "@/components/shared/PaymentModal";
import type { InstallmentPayment, LoanRequestHistoryItem } from "@/app/student/studentMockData";
import { MedicalBagIcon } from "./StudentIllustrations";
import ContactFooter from "../loan-details/ContactFooter";
import TopNav from "@/components/shared/TopNav";
import {
  computePaymentBehavior,
  mapToActiveLoanSummary,
  mapToInstallmentPayments,
  mapToLoanRequestHistoryItem,
  type PaymentBehaviorDisplay,
  type RawStudentLoan,
} from "@/lib/student-view-model";
import styles from "@/app/student/student.module.css";

type StudentDashboardProps = {
  profile?: StudentProfileDisplay;
  initialActiveLoan?: ActiveLoanDisplay | null;
  initialHistoryRequests?: LoanRequestHistoryItem[];
  initialInstallments?: InstallmentPayment[];
  initialPaymentBehavior?: PaymentBehaviorDisplay | null;
};

export default function StudentDashboard({
  profile: initialProfile,
  initialActiveLoan,
  initialHistoryRequests,
  initialInstallments,
  initialPaymentBehavior,
}: StudentDashboardProps) {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const preservedScrollPosition = useRef<number | null>(null);
  const router = useRouter();

  const [profile] = useState<StudentProfileDisplay>(initialProfile ?? defaultStudentProfile);
  const [activeLoanData, setActiveLoanData] = useState<ActiveLoanDisplay | null | undefined>(initialActiveLoan);
  const [historyRequests, setHistoryRequests] = useState<LoanRequestHistoryItem[] | undefined>(initialHistoryRequests);
  const [installments, setInstallments] = useState<InstallmentPayment[] | undefined>(initialInstallments);
  const [paymentBehaviorData, setPaymentBehaviorData] = useState<PaymentBehaviorDisplay | null | undefined>(
    initialPaymentBehavior,
  );

  useEffect(() => {
    if (initialActiveLoan !== undefined && initialHistoryRequests !== undefined) {
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        const [currentRes, listRes] = await Promise.all([
          fetch("/api/student/loan-requests/current"),
          fetch("/api/student/loan-requests"),
        ]);

        if (currentRes.ok) {
          const currentJson = await currentRes.json();
          if (isMounted) {
            const rawLoan = currentJson.data as RawStudentLoan | null;
            setActiveLoanData(mapToActiveLoanSummary(rawLoan));
            if (rawLoan?.installments) {
              setInstallments(mapToInstallmentPayments(rawLoan.installments));
            }
          }
        }

        if (listRes.ok) {
          const listJson = await listRes.json();
          if (isMounted) {
            const rawList = (listJson.data || []) as RawStudentLoan[];
            setHistoryRequests(rawList.map(mapToLoanRequestHistoryItem));
            setPaymentBehaviorData(computePaymentBehavior(rawList));
          }
        }
      } catch (err) {
        console.error("Failed to load student data from API", err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialActiveLoan, initialHistoryRequests]);

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

  const displayedRequests = historyRequests ?? defaultLoanRequestHistory;
  const currentActiveLoan = activeLoanData === undefined ? defaultActiveLoan : activeLoanData;
  const currentInstallments = installments ?? defaultInstallmentPayments;

  return (
    <main className={styles.studentPage}>
      <TopNav
        userName={profile.displayName}
        userId={profile.studentId}
        userRole="นักศึกษา"
        userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
        showSidebarButton={false}
      />

      <div className={styles.studentPageContent}>
        <div className={styles.studentContent}>
          {currentActiveLoan ? (
            <LoanSummaryCard
              activeLoan={currentActiveLoan}
              medicalBag={<MedicalBagIcon />}
              onOpenDetails={() => openLoanDetails(currentActiveLoan.requestNumber)}
              profile={profile}
            />
          ) : (
            <TempLoanSummaryCard profile={profile} />
          )}

          {paymentBehaviorData ? (
            <PaymentBehaviorCard behavior={paymentBehaviorData} />
          ) : null}

          {currentActiveLoan && "isDisbursed" in currentActiveLoan && currentActiveLoan.isDisbursed && currentInstallments.length > 0 ? (
            <InstallmentList installments={currentInstallments} onPay={setActivePayment} />
          ) : null}

          <LoanHistoryList
            onOpenRequest={openLoanDetails}
            onShowMore={toggleRequestHistory}
            requests={displayedRequests}
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
