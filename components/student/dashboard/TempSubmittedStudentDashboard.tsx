"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  tempLoanRequestHistory,
  tempCurrentLoanDetails,
  tempLoanTimeline,
  tempRepaymentSchedule,
  tempStudentProfile,
} from "@/app/student/temp/tempMockData";
import LoanHistoryList from "./LoanHistoryList";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanTimeline from "../loan-details/LoanTimeline";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import TransferSlipModal from "../loan-details/TransferSlipModal";
import TopNav from "@/components/shared/TopNav";
import ContactFooter from "../loan-details/ContactFooter";
import styles from "@/app/student/student.module.css";

export default function TempSubmittedStudentDashboard() {
  const router = useRouter();
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  return (
    <main className={styles.studentPage}>
      <TopNav
        showSidebarButton={false}
        userEmail={`${tempStudentProfile.studentId}@cmu.ac.th`}
        userId={tempStudentProfile.studentId}
        userName={tempStudentProfile.displayName}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <div className={styles.studentContent}>

        <section className={styles.tempSubmittedSummary} aria-labelledby="submitted-summary-title">
          <div>
            <h1 id="submitted-summary-title">สวัสดี, {tempStudentProfile.displayName}</h1>
            <p>
              {tempStudentProfile.programName} · {tempStudentProfile.yearLabel} ·{" "}
              {tempStudentProfile.studentId}
            </p>
          </div>
          <button
            className={styles.tempSubmittedSummaryAction}
            onClick={() => router.push("/student/loan/apply?step=3")}
            type="button"
          >
            ดูรายละเอียดคำร้อง
          </button>
        </section>

        <PaymentBehaviorCard />

        <section className={styles.tempCurrentApplication} aria-labelledby="current-application-title">
          <h2 id="current-application-title">คำร้องปัจจุบัน</h2>

          <LoanDetailOverview details={tempCurrentLoanDetails} />

          <LoanTimeline
            items={tempLoanTimeline}
            onShowTransferSlip={() => setIsSlipModalOpen(true)}
            confirmTransferLabel="ยืนยันการรับเงิน"
          />

          <LoanDetailSchedule items={tempRepaymentSchedule} />
        </section>

        <LoanHistoryList
          initialVisibleCount={2}
          lessLabel="ซ่อนรายละเอียด"
          moreLabel="ดูเพิ่มเติม"
          onShowMore={() => setShowAllRequests((current) => !current)}
          requests={tempLoanRequestHistory}
          showAllRequests={showAllRequests}
        />
        <ContactFooter />
        {isSlipModalOpen ? (
          <TransferSlipModal
            imageSrc="/mock-transfer-slip.svg"
            onClose={() => setIsSlipModalOpen(false)}
          />
        ) : null}
        </div>
      </div>
    </main>
  );
}
