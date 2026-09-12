"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { House, Pencil, X } from "lucide-react";
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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isWaitingForTransferConfirmation = details.statusLabel === "รอยืนยันการรับเงิน";
  const [isTransferAccepted, setIsTransferAccepted] = useState(!isWaitingForTransferConfirmation);
  const hasAdminTransferredFunds =
    ["disbursed", "closed"].includes(details.statusCode ?? "") ||
    details.timeline.some((item) => Boolean(item.transferDetails));
  const displayedTimeline = details.timeline.filter((item) => !item.isUpcoming);
  const isRepaymentInProgress =
    details.statusCode === "disbursed" || details.statusLabel.includes("อยู่ระหว่างการชำระ");
  const displayedDetails =
    isWaitingForTransferConfirmation && isTransferAccepted
      ? { ...details, statusLabel: "อยู่ระหว่างการชำระเงิน" }
      : details;

  const isReturned = details.statusCode === "returned" || details.statusLabel.includes("แก้ไข");
  const canCancelRequest = !["disbursed", "closed", "rejected", "cancelled"].includes(
    details.statusCode ?? "",
  );

  const handleCancelRequest = async () => {
    if (!details.id) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/student/loan-requests/${details.id}/cancel`, { method: "POST" });
      if (!response.ok) {
        window.alert("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setIsCancelDialogOpen(false);
      router.refresh();
    } catch {
      window.alert("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsCancelling(false);
    }
  };

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

      <LoanDetailOverview details={displayedDetails} showDownload={hasAdminTransferredFunds} />

      <LoanTimeline
        items={displayedTimeline}
        isTransferAccepted={isTransferAccepted}
        onConfirmTransfer={
          hasAdminTransferredFunds ? () => setIsTransferAccepted(true) : undefined
        }
        onShowTransferSlip={hasAdminTransferredFunds ? () => setIsSlipModalOpen(true) : undefined}
        onCancelRequest={() => setIsCancelDialogOpen(true)}
        showCancelRequest={canCancelRequest}
      />
      <TempDetailCard />
      <LoanDetailSchedule items={details.schedule} />
      {isRepaymentInProgress ? <LoanPaymentHistory items={details.paymentHistory} /> : null}
      <ContactFooter />
      {isSlipModalOpen ? (
        <TransferSlipModal
          imageSrc={details.transferSlipImage}
          onClose={() => setIsSlipModalOpen(false)}
        />
      ) : null}
      {isCancelDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            aria-labelledby="cancel-request-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            role="alertdialog"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X aria-hidden="true" size={28} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold text-gray-900" id="cancel-request-title">
              ยืนยันการยกเลิกคำร้อง
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              เมื่อยกเลิกแล้ว คำร้องนี้จะไม่สามารถดำเนินการต่อได้
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                disabled={isCancelling}
                onClick={() => setIsCancelDialogOpen(false)}
                type="button"
              >
                กลับ
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={isCancelling}
                onClick={handleCancelRequest}
                type="button"
              >
                {isCancelling ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
