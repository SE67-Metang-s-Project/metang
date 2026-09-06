"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FilePenLine } from "lucide-react";
import {
  activeLoan,
  getLoanDetails,
  installmentPayments,
  loanRequestHistory,
  paymentAccount,
  studentProfile,
} from "@/app/student/studentMockData";
import type { LoanInput } from "@/lib/loan-validation";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard from "./LoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import InstallmentList from "../payments/InstallmentList";
import PaymentModal from "@/components/shared/PaymentModal";
import type { InstallmentPayment } from "@/app/student/studentMockData";
import { MedicalBagIcon } from "./StudentIllustrations";
import ContactFooter from "../loan-details/ContactFooter";
import TopNav from "@/components/shared/TopNav";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import ReturnedRequestCorrectionForm from "@/components/student/corrections/ReturnedRequestCorrectionForm";
import type { ReturnedRequestCorrection } from "@/components/student/corrections/ReturnedRequestCorrectionForm";
import styles from "@/app/student/student.module.css";

export default function StudentDashboard() {
  const { language, setLanguage, t } = useStudentLanguage();
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [correction, setCorrection] = useState<ReturnedRequestCorrection | null>(null);
  const [preparedRequest, setPreparedRequest] = useState<{ amount: number; requestNumber: string } | null>(null);
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

  const openCorrection = (requestNumber: string) => {
    const requestCorrection = getLoanDetails(requestNumber)?.correction;
    if (requestCorrection) {
      setCorrection(requestCorrection);
    }
  };

  const handleResubmit = (requestId: string, payload: LoanInput) => {
    const requestNumber = correction?.requestNumber;
    if (!requestNumber) return;

    setPreparedRequest({ amount: payload.amount, requestNumber });
    setCorrection(null);
    void requestId;
  };

  const returnedRequest = loanRequestHistory.find(
    (request) => request.statusType === "revisionRequired",
  );

  return (
    <main className={styles.studentPage}>
      <TopNav
        userName={studentProfile.displayName}
        userId={studentProfile.studentId}
        userRole={t("นักศึกษา", "Student")}
        userEmail={`${studentProfile.studentId}@cmu.ac.th`}
        showSidebarButton={false}
        language={language}
        onLanguageChange={setLanguage}
        logoutLabel={t("ออกจากระบบ", "Sign out")}
      />

      <div className={styles.studentPageContent}>
        <div className={styles.studentContent}>
          <LoanSummaryCard
            medicalBag={<MedicalBagIcon />}
            onOpenDetails={() => openLoanDetails(activeLoan.requestNumber)}
          />
          {returnedRequest ? (
            <section className={styles.returnedRequestAlert} aria-labelledby="returned-request-alert-title">
              <div>
                <span className={styles.returnedRequestAlertIcon}>
                  <FilePenLine aria-hidden="true" size={21} />
                </span>
                <div>
                  <p>{t("มีคำร้องรอแก้ไข", "A request needs correction")}</p>
                  <h2 id="returned-request-alert-title">
                    {t("คำร้อง", "Request")} {returnedRequest.requestNumber} · {t("รอแก้ไขเอกสาร", "Document revision required")}
                  </h2>
                  <small>{t("ตรวจสอบความคิดเห็นของอาจารย์ที่ปรึกษาและยื่นใหม่", "Review your advisor's comment and resubmit your request.")}</small>
                </div>
              </div>
              <button
                className={styles.loanApplicationNext}
                onClick={() => openCorrection(returnedRequest.requestNumber)}
                type="button"
              >
                {t("แก้ไขเอกสาร", "Correct documents")}
              </button>
            </section>
          ) : null}
          <PaymentBehaviorCard />
          <InstallmentList
            installments={installmentPayments}
            onPay={setActivePayment}
          />
          <LoanHistoryList
            onShowMore={toggleRequestHistory}
            onCorrectRequest={openCorrection}
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

      {correction ? (
        <ReturnedRequestCorrectionForm
          correction={correction}
          onClose={() => setCorrection(null)}
          onResubmit={handleResubmit}
        />
      ) : null}

      {preparedRequest ? (
        <div className={styles.preparedResubmitNotice} role="status">
          <CheckCircle2 aria-hidden="true" size={20} />
          <span>
            {t("คำร้อง", "Request")} {preparedRequest.requestNumber} {t("พร้อมส่งจำนวน", "is ready to submit for")}{" "}
            {preparedRequest.amount.toLocaleString("th-TH")} {t("บาท เมื่อเชื่อมต่อระบบแล้ว", "THB once API wiring is connected")}
          </span>
          <button aria-label={t("ปิดข้อความ", "Dismiss message")} onClick={() => setPreparedRequest(null)} type="button">
            ×
          </button>
        </div>
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
              {t("ดำเนินการสำเร็จ!", "Payment submitted!")}
            </h2>
            <p className="mt-2 text-gray-600">{t("ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว", "Your payment evidence has been submitted.")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("เจ้าหน้าที่จะตรวจสอบและแจ้งผลให้ทราบภายหลัง", "Staff will review it and notify you of the result.")}</p>
            <button
              className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => setIsPaymentSuccessOpen(false)}
              type="button"
            >
              {t("ตกลง", "OK")}
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
