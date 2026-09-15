"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { LoanDetails } from "@/app/student/studentMockData";
import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";
import ContactFooter from "./ContactFooter";
import LoanDetailSchedule from "./LoanDetailSchedule";
import LoanDetailOverview from "./LoanDetailOverview";
import LoanPaymentHistory from "./LoanPaymentHistory";
import LoanTimeline from "./LoanTimeline";
import TempDetailCard from "./TempDetailCard";
import TransferSlipModal from "./TransferSlipModal";
import LoanPetitionModal from "@/components/shared/LoanPetitionModal";
import { mapStudentLoanToActionRequest } from "@/lib/student-action-request";
import {
  hasConfirmedTransfer,
  saveTransferConfirmation,
  subscribeToTransferConfirmation,
} from "@/lib/student-transfer-confirmation";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanDetailsPageProps = {
  details: LoanDetails;
  profile: StudentProfileDisplay & { phoneNumber?: string };
};

export default function LoanDetailsPage({ details, profile }: LoanDetailsPageProps) {
  const router = useRouter();
  const { t } = useStudentLanguage();
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPetitionModalOpen, setIsPetitionModalOpen] = useState(false);
  const cancelDialogDismiss = useModalDismiss({
    onClose: () => {
      if (!isCancelling) setIsCancelDialogOpen(false);
    },
    isOpen: isCancelDialogOpen,
  });
  const isWaitingForTransferConfirmation =
    details.statusCode === "pending_disbursement" ||
    details.statusLabel === "รอยืนยันการรับเงิน" ||
    details.statusLabel === "รอยืนยันการโอนเงิน";
  const hasAdminTransferredFunds =
    ["disbursed", "closed"].includes(details.statusCode ?? "") ||
    details.timeline.some((item) => Boolean(item.transferDetails));
  const transferConfirmationKey = details.id ?? details.requestNumber;
  const isTransferAccepted = useSyncExternalStore(
    (onChange) => subscribeToTransferConfirmation(transferConfirmationKey, onChange),
    () => hasConfirmedTransfer(transferConfirmationKey),
    () => false,
  );
  const displayedTimeline = details.timeline.filter((item) => !item.isUpcoming);
  const isRepaymentInProgress =
    details.statusCode === "disbursed" ||
    details.statusLabel.includes("อยู่ระหว่างการชำระ") ||
    details.statusLabel.includes("กำลังชำระ");
  const shouldShowDownload = isWaitingForTransferConfirmation || isRepaymentInProgress;
  const displayedDetails = useMemo(() => {
    return isWaitingForTransferConfirmation && isTransferAccepted
      ? { ...details, statusCode: undefined, statusLabel: "กำลังชำระ" }
      : details;
  }, [details, isTransferAccepted, isWaitingForTransferConfirmation]);

  const petitionRequest = useMemo(
    () => mapStudentLoanToActionRequest(displayedDetails, profile),
    [displayedDetails, profile],
  );

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
        window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
        return;
      }

      setIsCancelDialogOpen(false);
      router.refresh();
    } catch {
      window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={styles.loanDetailsPage}>
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
              {t("คำร้องนี้ถูกส่งกลับเพื่อแก้ไข", "Request returned for revision")}
            </h3>
            <p style={{ color: "#b45309", fontSize: "0.875rem", margin: 0 }}>
              {t(
                "กรุณาตรวจสอบเหตุผลจากผู้พิจารณาในขั้นตอนติดตามสถานะ แล้วกดแก้ไขข้อมูลเพื่อยื่นใหม่อีกครั้ง",
                "Please review the feedback in Request Status, update your information, and submit again.",
              )}
            </p>
          </div>
        </section>
      ) : null}

      <LoanDetailOverview
        details={displayedDetails}
        profile={profile}
        showDownload={shouldShowDownload}
        onDownloadClick={() => setIsPetitionModalOpen(true)}
      />

      <LoanTimeline
        items={displayedTimeline}
        isTransferAccepted={isTransferAccepted}
        onConfirmTransfer={
          hasAdminTransferredFunds
            ? () => {
                saveTransferConfirmation(details.id ?? details.requestNumber);
              }
            : undefined
        }
        onShowTransferSlip={hasAdminTransferredFunds ? () => setIsSlipModalOpen(true) : undefined}
        onCancelRequest={() => setIsCancelDialogOpen(true)}
        onEditRequest={isReturned ? () => router.push("/student/loan/apply") : undefined}
        showCancelRequest={canCancelRequest}
        showEditRequest={isReturned}
      />
      <TempDetailCard details={details} profile={profile} />
      <LoanDetailSchedule items={details.schedule} />
      {isRepaymentInProgress ? <LoanPaymentHistory items={details.paymentHistory} /> : null}
      <ContactFooter />
      {isPetitionModalOpen ? (
        <LoanPetitionModal
          isOpen={isPetitionModalOpen}
          onClose={() => setIsPetitionModalOpen(false)}
          request={petitionRequest}
        />
      ) : null}
      {isSlipModalOpen ? (
        <TransferSlipModal
          imageSrc={details.transferSlipImage}
          onClose={() => setIsSlipModalOpen(false)}
        />
      ) : null}
      {isCancelDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          {...cancelDialogDismiss}
          role="presentation"
        >
          <section
            aria-labelledby="cancel-request-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X aria-hidden="true" size={28} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold text-gray-900" id="cancel-request-title">
              {t("ยืนยันการยกเลิกคำร้อง", "Confirm cancellation")}
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              {t(
                "เมื่อยกเลิกแล้ว คำร้องนี้จะไม่สามารถดำเนินการต่อได้",
                "This request cannot be restored.",
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                disabled={isCancelling}
                onClick={() => setIsCancelDialogOpen(false)}
                type="button"
              >
                {t("กลับ", "Back")}
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={isCancelling}
                onClick={handleCancelRequest}
                type="button"
              >
                {isCancelling ? t("กำลังยกเลิก...", "Cancelling...") : t("ยืนยันยกเลิก", "Cancel")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
