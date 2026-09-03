"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { tempLoanRequestHistory, tempStudentProfile } from "@/app/student/temp/tempMockData";
import LoanHistoryList from "./LoanHistoryList";
import TempSubmittedStudentDashboard from "./TempSubmittedStudentDashboard";
import TempLoanSummaryCard from "./TempLoanSummaryCard";
import TempPaymentBehaviorCard from "./TempPaymentBehaviorCard";
import styles from "@/app/student/student.module.css";

export default function TempStudentDashboard() {
  const searchParams = useSearchParams();
  const isSubmitted = searchParams.get("submitted") === "true";
  const [showAllRequests, setShowAllRequests] = useState(false);

  if (isSubmitted) {
    return <TempSubmittedStudentDashboard />;
  }

  return (
    <main className={styles.studentPage}>
      <div className={styles.studentContent}>
        <header className={styles.studentHeader}>
          <div className={styles.brandMark}>Metang LOGO</div>
          <div className={styles.profileMark}>{tempStudentProfile.initials}</div>
        </header>

        <TempLoanSummaryCard />
        <TempPaymentBehaviorCard />
        <LoanHistoryList
          initialVisibleCount={2}
          lessLabel="ซ่อนรายละเอียด"
          moreLabel="ดูเพิ่มเติม"
          onShowMore={() => setShowAllRequests((current) => !current)}
          requests={tempLoanRequestHistory}
          sectionClassName={styles.tempHistorySection}
          showAllRequests={showAllRequests}
        />
      </div>
    </main>
  );
}
