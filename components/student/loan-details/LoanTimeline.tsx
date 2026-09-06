"use client";

import { Fragment, useState } from "react";
import { Check, CheckCircle2, Clock3, FilePenLine, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LoanTimelineItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type LoanTimelineProps = {
  items: LoanTimelineItem[];
  onShowTransferSlip: () => void;
  confirmTransferLabel?: string;
  isTransferAccepted?: boolean;
  onConfirmTransfer?: () => void;
  onStartCorrection?: () => void;
  showCorrectionAction?: boolean;
};

export default function LoanTimeline({
  items,
  onShowTransferSlip,
  confirmTransferLabel,
  isTransferAccepted = false,
  onConfirmTransfer,
  onStartCorrection,
  showCorrectionAction = false,
}: LoanTimelineProps) {
  const { language, t } = useStudentLanguage();
  const router = useRouter();
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);
  const [isConfirmationSuccessOpen, setIsConfirmationSuccessOpen] = useState(false);
  const hasAcceptedTransfer = isTransferAccepted || isTransferConfirmed;
  const shouldShowConfirmation = !hasAcceptedTransfer && Boolean(confirmTransferLabel || onConfirmTransfer);
  const confirmationLabel = confirmTransferLabel ?? t("ยืนยันการรับเงิน", "Confirm receipt of funds");

  const handleConfirmTransfer = () => {
    setIsTransferConfirmed(true);
    setIsConfirmationSuccessOpen(true);
    onConfirmTransfer?.();
  };

  return (
    <section
      aria-labelledby="loan-timeline-title"
      className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}
    >
      <header className={styles.sectionCardHeading}>
        <h2 id="loan-timeline-title">
          <Clock3 aria-hidden="true" size={23} strokeWidth={2.2} />
          {t("ติดตามสถานะคำร้อง", "Request progress")}
        </h2>
      </header>
      <ol className={styles.loanTimeline}>
        {items.map((item) => (
          <li className={styles.loanTimelineItem} key={item.title}>
            <span aria-hidden="true" className={styles.timelineMarker} />
            <div className={styles.timelineContent}>
              <strong>{localizeStudentContent(item.title, language)}</strong>
              <p>
                {localizeStudentContent(item.dateTime, language)} · {t("โดย", "by")} {item.actor}
              </p>
              {item.commentTitle && item.comment ? (
                <section className={`${styles.detailDashboardCard} ${styles.timelineCommentCard}`}>
                  <header className={styles.sectionCardHeading}>
                    <h2>{localizeStudentContent(item.commentTitle, language)}</h2>
                  </header>
                  <p>{localizeStudentContent(item.comment, language)}</p>
                </section>
              ) : null}
              {showCorrectionAction && onStartCorrection && item.commentTitle?.includes("อาจารย์ที่ปรึกษา") ? (
                <button
                  className={styles.timelineCorrectionButton}
                  onClick={onStartCorrection}
                  type="button"
                >
                  <FilePenLine aria-hidden="true" size={16} />
                  {t("แก้ไขเอกสารและยื่นใหม่", "Correct documents and resubmit")}
                </button>
              ) : null}
              {item.transferDetails ? (
                <dl className={styles.transferDetails}>
                  {item.transferDetails.map((detail) => (
                    <Fragment key={detail}>
                      <dt>{localizeStudentContent(detail.slice(0, detail.indexOf(":")), language)}</dt>
                      <dd>{detail.slice(detail.indexOf(":") + 1).trim()}</dd>
                    </Fragment>
                  ))}
                </dl>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div
        className={`${styles.loanTimelineActions} ${
          !shouldShowConfirmation ? styles.loanTimelineActionsSingle : ""
        }`}
      >
        <button
          className={styles.outlineOrangeButton}
          onClick={onShowTransferSlip}
          type="button"
        >
          <FileText aria-hidden="true" size={18} />
          {t("ดูหลักฐานการโอนเงิน", "View transfer evidence")}
        </button>
        {shouldShowConfirmation ? (
          <button className={styles.loanApplicationNext} onClick={handleConfirmTransfer} type="button">
            <Check aria-hidden="true" size={18} strokeWidth={3} />
            {confirmationLabel}
          </button>
        ) : null}
      </div>
      {isConfirmationSuccessOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
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
              {t("ยืนยันการรับเงินสำเร็จ", "Funds confirmed")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{t("ระบบบันทึกการยืนยันของคุณเรียบร้อยแล้ว", "Your confirmation has been recorded.")}</p>
            <button
              className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => router.replace("/student")}
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
