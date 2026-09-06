"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { House, Pencil } from "lucide-react";
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
  const router = useRouter();
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const isWaitingForTransferConfirmation = details.statusLabel === "รอยืนยันการรับเงิน";
  const [isTransferAccepted, setIsTransferAccepted] = useState(!isWaitingForTransferConfirmation);
  const displayedDetails =
    isWaitingForTransferConfirmation && isTransferAccepted
      ? { ...details, statusLabel: "อยู่ระหว่างการชำระเงิน" }
      : details;

  const isReturned = details.statusCode === "returned" || details.statusLabel.includes("แก้ไข");

  return (
    <div className={styles.loanDetailsPage}>
      <button aria-label="กลับหน้าหลัก" className={styles.loanDetailsBack} onClick={onBack} type="button">
        <House aria-hidden="true" size={17} />
        กลับหน้าหลัก
      </button>

      {isReturned ? (
        <section
          aria-labelledby="returned-notice-title"
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <div>
            <h3 id="returned-notice-title" style={{ color: "#92400e", fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem 0" }}>
              คำร้องนี้ถูกส่งกลับเพื่อแก้ไข
            </h3>
            <p style={{ color: "#b45309", fontSize: "0.875rem", margin: 0 }}>
              กรุณาตรวจสอบเหตุผลจากผู้พิจารณาในขั้นตอนติดตามสถานะ แล้วกดแก้ไขข้อมูลเพื่อยื่นใหม่อีกครั้ง
            </p>
          </div>
          <button
            onClick={() => router.push("/student/loan/apply")}
            type="button"
            style={{
              backgroundColor: "#d97706",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Pencil aria-hidden="true" size={16} />
            แก้ไขและยื่นคำร้องใหม่
          </button>
        </section>
      ) : null}

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
