"use client";

import { useState } from "react";
import type { LoanDetails } from "@/app/student/studentMockData";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import ContactFooter from "./ContactFooter";
import LoanDetailSchedule from "./LoanDetailSchedule";
import LoanPaymentHistory from "./LoanPaymentHistory";
import LoanTimeline from "./LoanTimeline";
import TempDetailCard from "./TempDetailCard";
import TransferSlipModal from "./TransferSlipModal";
import styles from "@/app/student/student.module.css";

type LoanDetailsPageProps = {
  details: LoanDetails;
  onBack: () => void;
};

export default function LoanDetailsPage({ details, onBack }: LoanDetailsPageProps) {
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  return (
    <div className={styles.loanDetailsPage}>
      <button aria-label="กลับหน้าหลัก" className={styles.loanDetailsBack} onClick={onBack} type="button">
        ← กลับหน้าหลัก
      </button>

      <section className={`${styles.loanDetailSection} ${styles.loanDetailOverview}`}>
        <div className={styles.loanDetailTopline}>
          <div>
            <h1>คำร้อง {details.requestNumber}</h1>
          </div>
          <span className={styles.loanDetailStatus}>{details.statusLabel}</span>
        </div>
        <div className={styles.loanDetailOverviewGrid}>
          <div className={styles.loanDetailSubmittedAt}>
            <p>{details.submittedAt}</p>
          </div>
          <div className={styles.loanDetailAmountValue}>
            <strong>{details.amount}</strong>
          </div>
          <div className={styles.loanDetailPurpose}>
            <span>{details.purposeLabel}</span>
            <strong>{details.purpose}</strong>
          </div>
          <div className={styles.loanDetailRepaymentMeta}>
            <span>{formatThaiBahtText(details.amount)}</span>
            <span>จำนวน {details.schedule.length} งวด</span>
          </div>
          <div className={styles.loanDetailAdditionalReason}>
            <span>{details.additionalReasonLabel}</span>
            <strong>{details.additionalReason}</strong>
          </div>
        </div>
        <button className={styles.loanDownloadButton} type="button">
          <span aria-hidden="true">⇩</span>
          {details.downloadLabel}
        </button>
      </section>

      <LoanTimeline
        items={details.timeline}
        onShowTransferSlip={() => setIsSlipModalOpen(true)}
      />
      <TempDetailCard />
      <LoanDetailSchedule items={details.schedule} />
      <LoanPaymentHistory items={details.paymentHistory} />
      <ContactFooter />
      {isSlipModalOpen ? (
        <TransferSlipModal
          imageSrc={details.transferSlipImage}
          onClose={() => setIsSlipModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
