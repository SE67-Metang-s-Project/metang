"use client";

import { Fragment, useState } from "react";
import { Check, CheckCircle2, Clock3, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LoanTimelineItem } from "@/app/student/studentMockData";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanTimelineProps = {
  items?: LoanTimelineItem[];
  onShowTransferSlip?: () => void;
  confirmTransferLabel?: string;
  isTransferAccepted?: boolean;
  onConfirmTransfer?: () => void;
  onCancelRequest?: () => void;
  showCancelRequest?: boolean;
};

export default function LoanTimeline({
  items = [],
  onShowTransferSlip,
  confirmTransferLabel,
  isTransferAccepted = false,
  onConfirmTransfer,
  onCancelRequest,
  showCancelRequest = false,
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
  const shouldShowConfirmation = !hasAcceptedTransfer && Boolean(confirmTransferLabel || onConfirmTransfer);
  const confirmationLabel = confirmTransferLabel ?? t("ยืนยันการรับเงิน", "Confirm receipt");

  const handleConfirmTransfer = () => {
    setIsTransferConfirmed(true);
    setIsConfirmationSuccessOpen(true);
    onConfirmTransfer?.();
  };

  const hasItems = items && items.length > 0;
  const currentItemIndex = items.reduce(
    (currentIndex, item, index) => (item.isUpcoming ? currentIndex : index),
    -1,
  );

  return (
    <section
      aria-labelledby="loan-timeline-title"
      className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}
    >
      <header className={styles.sectionCardHeading}>
        <h2 id="loan-timeline-title">
          <Clock3 aria-hidden="true" size={23} strokeWidth={2.2} />
          {t("ติดตามสถานะคำร้อง", "Request Status")}
        </h2>
      </header>
      {hasItems ? (
        <ol className={styles.loanTimeline}>
          {items.map((item, index) => (
            <li className={styles.loanTimelineItem} key={item.title}>
              <span
                aria-hidden="true"
                className={`${styles.timelineMarker} ${item.isPending ? styles.timelineMarkerPending : ""} ${
                  item.isUpcoming ? styles.timelineMarkerUpcoming : ""
                } ${
                  item.isFailed ? styles.timelineMarkerFailed : ""
                }`}
              />
              <div className={styles.timelineContent}>
                <strong>{localizeStudentContent(item.title, language)}</strong>
                <p>
                  {localizeStudentContent(item.dateTime, language)} · {t("โดย", "by")} {" "}
                  {localizeStudentContent(item.actor, language)}
                </p>
                {item.commentTitle && item.comment ? (
                  <section
                    className={`${styles.detailDashboardCard} ${styles.timelineCommentCard} ${
                      item.isFailed ? styles.timelineCommentCardRejected : ""
                    }`}
                  >
                    <header className={styles.sectionCardHeading}>
                      <h2>{localizeStudentContent(item.commentTitle, language)}</h2>
                    </header>
                    <p>{localizeStudentContent(item.comment, language)}</p>
                  </section>
                ) : null}
                {item.transferDetails ? (
                  <>
                    <dl className={styles.transferDetails}>
                      {item.transferDetails.map((detail) => (
                        <Fragment key={detail}>
                          <dt>{localizeStudentContent(detail.slice(0, detail.indexOf(":")), language)}</dt>
                          <dd>{localizeStudentContent(detail.slice(detail.indexOf(":") + 1).trim(), language)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                    {onShowTransferSlip || shouldShowConfirmation ? (
                      <div
                        className={`${styles.loanTimelineActions} ${
                          !shouldShowConfirmation ? styles.loanTimelineActionsSingle : ""
                        }`}
                      >
                        {onShowTransferSlip ? (
                          <button className={styles.outlineOrangeButton} onClick={onShowTransferSlip} type="button">
                            <FileText aria-hidden="true" size={18} />
                            {t("ดูหลักฐาน", "View proof")}
                          </button>
                        ) : null}
                        {shouldShowConfirmation ? (
                          <button className={styles.loanApplicationNext} onClick={handleConfirmTransfer} type="button">
                            <Check aria-hidden="true" size={18} strokeWidth={3} />
                            {confirmationLabel}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : null}
                {showCancelRequest && index === currentItemIndex ? (
                  <button
                    className={styles.loanTimelineCancelButton}
                  onClick={onCancelRequest}
                  type="button"
                >
                    {t("ยกเลิกคำร้อง", "Cancel request")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.emptyDashboardState}>
          <span aria-hidden="true" className={styles.emptyDashboardStateIcon}>
            <Clock3 size={24} strokeWidth={2} />
          </span>
          <p>
            {t("ไม่มีคำร้องขอกู้ยืมที่อยู่ระหว่างดำเนินการ", "No loan request is in progress")}
          </p>
          <span>
            {t("การติดตามสถานะจะแสดงที่นี่เมื่อมีการยื่นคำร้อง", "Tracking appears after submission")}
          </span>
        </div>
      )}
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
            <CheckCircle2 aria-hidden="true" className="mx-auto text-green-500" size={64} strokeWidth={1.5} />
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
    </section>
  );
}
