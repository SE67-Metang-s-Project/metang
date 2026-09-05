"use client";

import { useState } from "react";
import { House } from "lucide-react";
import type { LoanDetails } from "@/app/student/studentMockData";
import ContactFooter from "./ContactFooter";
import LoanDetailSchedule from "./LoanDetailSchedule";
import LoanDetailOverview from "./LoanDetailOverview";
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
  const isWaitingForTransferConfirmation = details.statusLabel === "รอยืนยันการรับเงิน";
  const [isTransferAccepted, setIsTransferAccepted] = useState(!isWaitingForTransferConfirmation);
  const displayedDetails =
    isWaitingForTransferConfirmation && isTransferAccepted
      ? { ...details, statusLabel: "อยู่ระหว่างการชำระเงิน" }
      : details;

  return (
    <div className={styles.loanDetailsPage}>
      <button aria-label="กลับหน้าหลัก" className={styles.loanDetailsBack} onClick={onBack} type="button">
        <House aria-hidden="true" size={17} />
        กลับหน้าหลัก
      </button>

      <LoanDetailOverview details={displayedDetails} />

      <LoanTimeline
        items={details.timeline}
        isTransferAccepted={isTransferAccepted}
        onConfirmTransfer={() => setIsTransferAccepted(true)}
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
