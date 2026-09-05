"use client";

import { useState } from "react";
import {
  tempCurrentLoanDetails,
  tempLoanRequestHistory,
  tempLoanTimeline,
  tempRepaymentSchedule,
  tempStudentProfile,
} from "@/app/student/temp/tempMockData";
import LoanHistoryList from "./LoanHistoryList";
import TempLoanSummaryCard from "./TempLoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import TopNav from "@/components/shared/TopNav";
import ContactFooter from "../loan-details/ContactFooter";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanTimeline from "../loan-details/LoanTimeline";
import TransferSlipModal from "../loan-details/TransferSlipModal";
import styles from "@/app/student/student.module.css";

export default function TempStudentDashboard() {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const hasActiveRequest = tempLoanRequestHistory.some(
    (request) => request.statusType !== "completed" && request.statusType !== "rejectedExecutive",
  );

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
          <TempLoanSummaryCard />
          <PaymentBehaviorCard />
          {hasActiveRequest ? (
            <div className={styles.tempRequestDetailPanel}>
              <LoanDetailOverview
                details={{ ...tempCurrentLoanDetails, schedule: tempRepaymentSchedule }}
              />
              <LoanTimeline
                confirmTransferLabel="ยืนยันการรับเงิน"
                items={tempLoanTimeline}
                onShowTransferSlip={() => setIsSlipModalOpen(true)}
              />
              <LoanDetailSchedule items={tempRepaymentSchedule} />
            </div>
          ) : null}
          <LoanHistoryList
            initialVisibleCount={2}
            lessLabel="ซ่อนรายละเอียด"
            moreLabel="ดูเพิ่มเติม"
            onShowMore={() => setShowAllRequests((current) => !current)}
            requests={tempLoanRequestHistory}
            sectionClassName={styles.tempHistorySection}
            showAllRequests={showAllRequests}
          />
          <ContactFooter />
          {isSlipModalOpen ? (
            <TransferSlipModal
              imageSrc="/mock-payment-receipt-2.jpg"
              onClose={() => setIsSlipModalOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
