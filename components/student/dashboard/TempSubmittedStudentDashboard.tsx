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
import TempPaymentBehaviorCard from "./TempPaymentBehaviorCard";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanTimeline from "../loan-details/LoanTimeline";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import TransferSlipModal from "../loan-details/TransferSlipModal";
import styles from "@/app/student/student.module.css";

export default function TempSubmittedStudentDashboard() {
  const router = useRouter();
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  return (
    <main className={styles.studentPage}>
      <div className={styles.studentContent}>
        <header className={styles.studentHeader}>
          <div className={styles.brandMark}>Metang LOGO</div>
          <div className={styles.profileMark}>{tempStudentProfile.initials}</div>
        </header>

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
            onClick={() => router.push("/student/temp/apply?step=3")}
            type="button"
          >
            ดูรายละเอียดคำร้อง
          </button>
        </section>

        <TempPaymentBehaviorCard />

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
        {isSlipModalOpen ? (
          <TransferSlipModal
            imageSrc="/mock-transfer-slip.svg"
            onClose={() => setIsSlipModalOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
