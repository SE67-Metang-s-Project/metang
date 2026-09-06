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
import ReturnedRequestCorrectionForm from "@/components/student/corrections/ReturnedRequestCorrectionForm";
import type { LoanInput } from "@/lib/loan-validation";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type LoanDetailsPageProps = {
  details: LoanDetails;
  onBack: () => void;
};

export default function LoanDetailsPage({ details, onBack }: LoanDetailsPageProps) {
  const { t } = useStudentLanguage();
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [preparedAmount, setPreparedAmount] = useState<number | null>(null);
  const isWaitingForTransferConfirmation = details.statusLabel === "รอยืนยันการรับเงิน";
  const [isTransferAccepted, setIsTransferAccepted] = useState(!isWaitingForTransferConfirmation);
  const displayedDetails =
    isWaitingForTransferConfirmation && isTransferAccepted
      ? { ...details, statusLabel: t("อยู่ระหว่างการชำระเงิน", "Payment in progress") }
      : details;

  const handleResubmit = (requestId: string, payload: LoanInput) => {
    setPreparedAmount(payload.amount);
    setIsCorrectionOpen(false);
    void requestId;
  };

  return (
    <div className={styles.loanDetailsPage}>
      <button aria-label={t("กลับหน้าหลัก", "Back to dashboard")} className={styles.loanDetailsBack} onClick={onBack} type="button">
        <House aria-hidden="true" size={17} />
        {t("กลับหน้าหลัก", "Back to dashboard")}
      </button>

      <LoanDetailOverview details={displayedDetails} />

      <LoanTimeline
        items={details.timeline}
        isTransferAccepted={isTransferAccepted}
        onConfirmTransfer={() => setIsTransferAccepted(true)}
        onStartCorrection={details.correction ? () => setIsCorrectionOpen(true) : undefined}
        onShowTransferSlip={() => setIsSlipModalOpen(true)}
        showCorrectionAction={Boolean(details.correction)}
      />
      {preparedAmount !== null ? (
        <div className={styles.preparedResubmitNotice} role="status">
          <span>
            {t("ข้อมูลที่แก้ไขพร้อมส่งจำนวน", "Corrected request is ready to submit for")} {preparedAmount.toLocaleString("th-TH")} {t("บาท เมื่อเชื่อมต่อระบบแล้ว", "THB once API wiring is connected")}
          </span>
          <button aria-label={t("ปิดข้อความ", "Dismiss message")} onClick={() => setPreparedAmount(null)} type="button">
            ×
          </button>
        </div>
      ) : null}
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
      {isCorrectionOpen && details.correction ? (
        <ReturnedRequestCorrectionForm
          correction={details.correction}
          onClose={() => setIsCorrectionOpen(false)}
          onResubmit={handleResubmit}
        />
      ) : null}
    </div>
  );
}
