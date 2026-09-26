"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LoanTimelineItem } from "@/app/student/studentMockData";
import RequestTimeline, {
  type ActionHistory,
  type BankDetails,
} from "@/components/shared/RequestTimeline";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items?: LoanTimelineItem[];
  onShowTransferSlip?: () => void;
  onDownloadRequest?: () => void;
  confirmTransferLabel?: string;
  isTransferAccepted?: boolean;
  onConfirmTransfer?: () => void;
  onCancelRequest?: () => void;
  showCancelRequest?: boolean;
  onEditRequest?: () => void;
  showEditRequest?: boolean;
  compactActions?: boolean;
  bankDetails?: BankDetails;
  hideBankDetails?: boolean;
  requestStatus?: string;
  advisorName?: string;
  advisorNameEn?: string;
  showHistoryAction?: boolean;
};

function getRequestStatus(items: LoanTimelineItem[], isTransferAccepted: boolean) {
  const pendingItem = items.find((item) => item.isPending);
  const pendingTitle = pendingItem?.title ?? "";

  if (items.some((item) => item.isFailed)) return "rejected";
  if (
    !isTransferAccepted &&
    (pendingTitle.includes("เจ้าหน้าที่การเงิน") ||
      pendingTitle.includes("โอนเงิน") ||
      (Boolean(pendingItem) && items.some((item) => item.title.includes("โอนเงิน") && !item.isPending)))
  ) {
    return "pending_disbursement";
  }
  if (isTransferAccepted || items.some((item) => item.title.includes("โอนเงิน") && !item.isPending)) {
    return "disbursed";
  }
  if (pendingTitle.includes("ผู้บริหาร")) return "pending_executive";
  if (pendingTitle.includes("เจ้าหน้าที่")) return "pending_admin";

  return "pending_advisor";
}

export default function LoanTimeline({
  items = [],
  onShowTransferSlip,
  onDownloadRequest,
  confirmTransferLabel,
  isTransferAccepted = false,
  onConfirmTransfer,
  onCancelRequest,
  showCancelRequest = false,
  onEditRequest,
  showEditRequest = false,
  compactActions = false,
  bankDetails,
  hideBankDetails = false,
  requestStatus,
  advisorName: advisorNameProp,
  advisorNameEn,
  showHistoryAction = false,
}: LoanTimelineProps) {
  const router = useRouter();
  const { language, t } = useStudentLanguage();
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);
  const [isConfirmationSuccessOpen, setIsConfirmationSuccessOpen] = useState(false);
  const successDismiss = useModalDismiss({
    onClose: () => router.replace("/student"),
    isOpen: isConfirmationSuccessOpen,
  });
  const hasAcceptedTransfer = isTransferAccepted || isTransferConfirmed;
  const effectiveRequestStatus = hasAcceptedTransfer
    ? "repaying"
    : requestStatus ?? getRequestStatus(items, false);
  const shouldShowConfirmation =
    !hasAcceptedTransfer &&
    effectiveRequestStatus === "pending_disbursement" &&
    Boolean(confirmTransferLabel || onConfirmTransfer);
  const advisorName = advisorNameProp ?? items.find((item) => item.title.includes("อาจารย์"))?.actor;
  const hasExecutiveReturnForRevision = items.some(
    (item) => item.title.includes("ผู้บริหาร") && item.title.includes("ส่งกลับแก้ไข"),
  );
  const history: ActionHistory[] = items.map((item) => ({
    action: item.title,
    date: item.dateTime,
    actor: item.actor,
    actorEn: item.actorEn,
    commentTitle: item.commentTitle,
    comment: item.comment,
    isCompleted: item.isCompleted,
    isPending: item.isPending,
    isUpcoming: item.isUpcoming,
    isFailed: item.isFailed,
    transferDetails: item.transferDetails,
  }));
  const timelineHistory = hasExecutiveReturnForRevision
    ? history.filter(
        (item) => !(item.action.includes("ผู้บริหาร") && item.action.includes("ส่งกลับแก้ไข")),
      )
    : history;

  const handleConfirmTransfer = () => {
    setIsTransferConfirmed(true);
    setIsConfirmationSuccessOpen(true);
    onConfirmTransfer?.();
  };

  const requestActions =
    showEditRequest || showCancelRequest ? (
      <div className={styles.loanTimelineRequestActions}>
        {showEditRequest ? (
          <button className={styles.loanTimelineEditButton} onClick={onEditRequest} type="button">
            {t("แก้ไขคำร้อง", "Edit request")}
          </button>
        ) : null}
        {showCancelRequest ? (
          <button className={styles.loanTimelineCancelButton} onClick={onCancelRequest} type="button">
            {t("ยกเลิกคำร้อง", "Cancel request")}
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <RequestTimeline
        advisorName={advisorName}
        advisorNameEn={advisorNameEn}
        bankDetails={bankDetails}
        className={`${styles.studentRequestTimeline} ${
          compactActions ? styles.loanTimelineCompactActions : ""
        }`}
        footer={requestActions}
        history={history}
        hideBankDetails={hideBankDetails}
        language={language}
        onConfirmReceipt={shouldShowConfirmation ? handleConfirmTransfer : undefined}
        onShowTransferSlip={onShowTransferSlip}
        onDownloadRequest={onDownloadRequest}
        requestStatus={items.length ? effectiveRequestStatus : undefined}
        emptyTitle={t("ยังไม่มีคำร้องขอกู้ยืม", "No loan request yet")}
        emptyDescription={t(
          "สถานะคำร้องจะแสดงที่นี่เมื่อมีการยื่นคำร้อง",
          "Request status appears after submission",
        )}
        showHistoryAction={items.length > 0}
        alwaysShowHistoryAction={showHistoryAction}
        showEmptyWhenNoHistory
        splitReturnedStatus
        title={t("ติดตามสถานะคำร้อง", "Request Status")}
        timelineHistory={timelineHistory}
      />

      {isConfirmationSuccessOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          {...successDismiss}
          role="presentation"
        >
          <section
            aria-labelledby="transfer-confirmation-success-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="alertdialog"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto text-green-500"
              size={64}
              strokeWidth={1.5}
            />
            <h2 className="mt-4 text-xl font-bold text-gray-900" id="transfer-confirmation-success-title">
              {t("ยืนยันการรับเงินสำเร็จ", "Receipt confirmed")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("ระบบบันทึกการยืนยันของคุณเรียบร้อยแล้ว", "Your confirmation has been recorded.")}
            </p>
            <button
              className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => {
                setIsConfirmationSuccessOpen(false);
                router.replace("/student");
              }}
              type="button"
            >
              {t("กลับสู่หน้าหลัก", "Back to dashboard")}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
