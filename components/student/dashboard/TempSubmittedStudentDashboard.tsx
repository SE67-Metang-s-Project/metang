"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  tempLoanRequestHistory,
  tempLoanTimeline,
  tempRepaymentSchedule,
  tempStudentProfile,
} from "@/app/student/temp/tempMockData";
import LoanHistoryList from "./LoanHistoryList";
import TempPaymentBehaviorCard from "./TempPaymentBehaviorCard";
import styles from "@/app/student/student.module.css";

export default function TempSubmittedStudentDashboard() {
  const router = useRouter();
  const [showAllRequests, setShowAllRequests] = useState(false);

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

          <div className={styles.tempCurrentOverview}>
            <div className={styles.tempCurrentOverviewTopline}>
              <div>
                <h3>คำร้อง SL-2568-0001</h3>
                <p>ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.</p>
              </div>
              <span className={styles.tempDetailStatus}>รอยืนยันการรับเงิน</span>
            </div>
            <div className={styles.tempCurrentOverviewGrid}>
              <div>
                <span>วัตถุประสงค์การกู้ยืม</span>
                <strong>ค่าเทอมภาคเรียนที่ 1/2569</strong>
              </div>
              <div className={styles.tempDetailAmount}>
                <span>จำนวนที่ขอกู้</span>
                <strong>฿3,000</strong>
                <small>สามพันบาทไทยถ้วน</small>
              </div>
              <div>
                <span>หมายเหตุเพิ่มเติม</span>
                <strong>
                  ข้าพเจ้ามีความจำเป็นต้องกู้ยืมเพื่อชำระค่าเทอม เนื่องจากครอบครัวขาดสภาพคล่องทางการเงิน
                  เพื่อให้สามารถศึกษาต่อได้อย่างต่อเนื่อง
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.tempCurrentTimeline}>
            <h3>ไทม์ไลน์สถานะคำร้อง</h3>
            <ol className={styles.tempLoanTimeline}>
              {tempLoanTimeline.map((item) => (
                <li key={item.title}>
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.dateTime} · โดย {item.actor}
                    </p>
                    {item.transferDetails ? (
                      <ul>
                        {item.transferDetails.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.tempDetailTimelineActions}>
              <button className={styles.loanFormBack} type="button">
                ดูหลักฐานการโอนเงิน
              </button>
              <button className={styles.loanApplicationNext} type="button">
                ยืนยันการรับเงิน
              </button>
            </div>
          </div>

          <div className={styles.tempCurrentSchedule}>
            <h3>ตารางการชำระ</h3>
            <div className={styles.tempDetailSchedule}>
              {tempRepaymentSchedule.map((item) => (
                <div key={item.installmentNumber}>
                  <strong>งวด {item.installmentNumber}</strong>
                  <span>{item.dueDateLabel}</span>
                  <strong>{item.amount}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LoanHistoryList
          initialVisibleCount={2}
          lessLabel="ซ่อนรายละเอียด"
          moreLabel="ดูเพิ่มเติม"
          onShowMore={() => setShowAllRequests((current) => !current)}
          requests={tempLoanRequestHistory}
          showAllRequests={showAllRequests}
          showMoreButton
        />
      </div>
    </main>
  );
}
