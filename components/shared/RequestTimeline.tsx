"use client";

import React, { Fragment, useState } from "react";
import {
  Clock3,
  Download,
  FileText,
  Pencil,
  History,
  X,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  Ban,
  HandCoins,
} from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import {
  localizeStudentContent,
  type StudentLanguage,
} from "@/app/student/StudentLanguageProvider";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import styles from "@/app/student/student.module.css";

import {
  type ActionHistory,
  type ApprovalStep,
  type BankDetails,
  type FullActionHistoryItem,
  buildFiveStepTimeline,
  buildFullActionHistory,
  isBankDetail,
} from "@/lib/request-timeline-model";

export type { ActionHistory, ApprovalStep, BankDetails, FullActionHistoryItem };
export { buildFiveStepTimeline, buildFullActionHistory };

const timelineEnglishText: Record<string, string> = {
  "ยื่นคำร้องขอกู้ยืม": "Loan request submitted",
  "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ": "Advisor review and approval",
  "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน": "Admin document review",
  "ผู้บริหารอนุมัติคำร้อง": "Executive approval",
  "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว": "Funds transferred by admin",
  "ยื่นคำร้องสำเร็จ": "Request submitted",
  "กำลังดำเนินการ": "In progress",
  "ขั้นตอนถัดไป": "Next step",
  "เห็นชอบแล้ว": "Approved",
  "ตรวจสอบเรียบร้อย": "Verified",
  "อนุมัติเรียบร้อย": "Approved",
  "โอนเงินสำเร็จ": "Funds transferred",
  "รอยืนยันการโอนเงิน": "Waiting for transfer confirmation",
  "กรุณายืนยันการรับเงิน": "Please confirm receipt of funds",
  "เจ้าหน้าที่การเงิน": "Finance officer",
  "ความคิดเห็นของเจ้าหน้าที่การเงิน": "Finance officer's comment",
};

function localizeTimelineText(value: string, language: StudentLanguage) {
  if (language === "th") return value;

  const directTranslation = timelineEnglishText[value] ?? localizeStudentContent(value, language);

  return directTranslation
    .replaceAll("ส่งกลับมาแก้ไข", "Returned for revision")
    .replaceAll("ไม่อนุมัติ", "Rejected")
    .replaceAll("โดย", "by")
    .replace(/\(การแก้ไขครั้งที่ (\d+)\)/g, "(Revision $1)");
}

function splitTransferDetail(detail: string, language: StudentLanguage) {
  const colonIndex = detail.indexOf(":");
  if (colonIndex === -1) {
    return { label: localizeTimelineText(detail, language), value: "" };
  }

  const rawLabel = detail.slice(0, colonIndex).trim();
  const label =
    rawLabel === "ธนาคาร" || rawLabel === "ชื่อธนาคาร"
      ? language === "en"
        ? "Bank name"
        : "ชื่อธนาคาร"
      : localizeTimelineText(rawLabel, language);

  return {
    label,
    value: localizeTimelineText(detail.slice(colonIndex + 1).trim(), language),
  };
}

function splitReturnedStatusDate(value: string) {
  const match = value.match(/^ส่งกลับมาแก้ไข \((.+)\)$/);
  return match ? { status: "ส่งกลับมาแก้ไข", date: match[1] } : null;
}

function getStatusBadgeConfig(statusType: FullActionHistoryItem["statusType"], language: StudentLanguage) {
  const label = (thai: string, english: string) => (language === "en" ? english : thai);

  switch (statusType) {
    case "submitted":
      return {
        label: label("ยื่นคำร้อง", "Submitted"),
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <FileText size={13} className="shrink-0" />,
        dotClass: "bg-blue-500",
      };
    case "resubmitted":
      return {
        label: label("ส่งการแก้ไข", "Resubmitted"),
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <Pencil size={13} className="shrink-0" />,
        dotClass: "bg-indigo-500",
      };
    case "returned":
      return {
        label: label("ส่งกลับแก้ไข", "Returned for revision"),
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <RotateCcw size={13} className="shrink-0" />,
        dotClass: "bg-amber-500",
      };
    case "approved":
      return {
        label: label("เห็นชอบ/อนุมัติ", "Approved"),
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 size={13} className="shrink-0" />,
        dotClass: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: label("ไม่อนุมัติ", "Rejected"),
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle size={13} className="shrink-0" />,
        dotClass: "bg-red-500",
      };
    case "disbursed":
      return {
        label: label("โอนเงินเรียบร้อย", "Funds transferred"),
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <HandCoins size={13} className="shrink-0" />,
        dotClass: "bg-blue-500",
      };
    case "cancelled":
      return {
        label: label("ยกเลิกคำร้อง", "Cancelled"),
        badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <Ban size={13} className="shrink-0" />,
        dotClass: "bg-gray-500",
      };
    case "pending":
    default:
      return {
        label: label("กำลังดำเนินการ", "In progress"),
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <Clock size={13} className="shrink-0" />,
        dotClass: "bg-orange-200",
      };
  }
}

export interface RequestTimelineProps {
  history?: ActionHistory[];
  timelineHistory?: ActionHistory[];
  approvals?: ApprovalStep[];
  requestStatus?: string;
  bankDetails?: BankDetails;
  advisorName?: string;
  advisorNameEn?: string;
  studentName?: string;
  submitDate?: string;
  title?: string;
  className?: string;
  onShowTransferSlip?: () => void;
  onConfirmReceipt?: () => void;
  onDownloadRequest?: () => void;
  hideComments?: boolean;
  hideBankDetails?: boolean;
  footer?: React.ReactNode;
  showEmptyWhenNoHistory?: boolean;
  showHistoryAction?: boolean;
  alwaysShowHistoryAction?: boolean;
  splitReturnedStatus?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  language?: StudentLanguage;
}

export default function RequestTimeline({
  history = [],
  timelineHistory,
  approvals = [],
  requestStatus,
  bankDetails,
  advisorName,
  advisorNameEn,
  studentName,
  submitDate,
  title = "ติดตามสถานะคำร้อง",
  className = "",
  onShowTransferSlip,
  onConfirmReceipt,
  onDownloadRequest,
  hideComments = false,
  hideBankDetails = false,
  footer,
  showEmptyWhenNoHistory = false,
  showHistoryAction = true,
  alwaysShowHistoryAction = false,
  splitReturnedStatus = false,
  emptyTitle,
  emptyDescription,
  language = "th",
}: RequestTimelineProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const modalDismiss = useModalDismiss({
    onClose: () => setIsHistoryModalOpen(false),
    isOpen: isHistoryModalOpen,
  });

  const timelineItems = buildFiveStepTimeline({
    history: timelineHistory ?? history,
    approvals,
    requestStatus,
    bankDetails,
    advisorName,
    studentName,
    submitDate,
    hideComments,
    hideBankDetails,
  });

  const fullHistory = buildFullActionHistory({
    history,
    approvals,
    requestStatus,
    bankDetails,
    advisorName,
    studentName,
    submitDate,
  });

  const hasSourceHistory =
    history.length > 0 || approvals.length > 0 || Boolean(requestStatus || submitDate);
  const hasItems = showEmptyWhenNoHistory ? hasSourceHistory : timelineItems.length > 0;
  const t = (thai: string, english: string) => (language === "en" ? english : thai);
  const localizeActor = (actor: string, actorEn?: string) =>
    language === "en" && actorEn
      ? actorEn
      : language === "en" && advisorNameEn && actor === advisorName
        ? advisorNameEn
        : localizeTimelineText(actor, language);

  return (
    <section className={`${styles.loanApprovalInfoCard} ${className}`}>
      <CardHeader
        className={styles.sectionCardHeading}
        icon={<Clock3 aria-hidden="true" size={20} strokeWidth={2.2} />}
        title={title}
        action={showHistoryAction && (hasSourceHistory || alwaysShowHistoryAction) ? (
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 rounded-lg transition-colors cursor-pointer shadow-xs"
            title={t("ดูประวัติการดำเนินการทั้งหมด", "Show full log")}
            aria-label={t("ดูประวัติการดำเนินการทั้งหมด", "Show full log")}
          >
            <History aria-hidden="true" size={14} strokeWidth={2.2} />
            <span className="hidden sm:inline">{t("ดูประวัติการดำเนินการทั้งหมด", "Show full log")}</span>
            <span className="sm:hidden">{t("ดูประวิติ", "Show log")}</span>
          </button>
        ) : null}
      />
      {hasItems ? (
        <ol className={styles.loanTimeline}>
          {timelineItems.map((item, index) => {
            const isRevisionItem = Boolean(item.isRevision) || item.date.startsWith("ส่งกลับมาแก้ไข");
            const isFailed = Boolean(item.isFailed);
            const isPending = Boolean(item.isPending);
            const isUpcoming = Boolean(item.isUpcoming);
            const returnedStatus = splitReturnedStatus ? splitReturnedStatusDate(item.date) : null;

            return (
              <li className={styles.loanTimelineItem} key={`${item.action}-${index}`}>
                <span
                  aria-hidden="true"
                  className={`${styles.timelineMarker} ${
                    isPending ? styles.timelineMarkerPending : ""
                  } ${isUpcoming ? styles.timelineMarkerUpcoming : ""} ${
                    isFailed ? styles.timelineMarkerFailed : ""
                  } ${isRevisionItem ? styles.timelineMarkerRevision : ""}`}
                />
                <div className={styles.timelineContent}>
                  <strong>{localizeTimelineText(item.action, language)}</strong>
                  <p>
                    {returnedStatus ? (
                      <>
                        <span>{localizeTimelineText(returnedStatus.status, language)}</span>
                        <span className="block">
                          {localizeTimelineText(returnedStatus.date, language)}
                          {item.actor
                            ? ` · ${t("โดย", "by")} ${localizeActor(item.actor, item.actorEn)}`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        {localizeTimelineText(item.date, language)}
                        {item.actor
                          ? ` · ${t("โดย", "by")} ${localizeActor(item.actor, item.actorEn)}`
                          : ""}
                      </>
                    )}
                  </p>
                  {!hideComments && item.commentTitle && item.comment ? (
                    <section
                      className={`${styles.detailDashboardCard} ${styles.timelineCommentCard} ${
                        isFailed ? styles.timelineCommentCardRejected : ""
                      }`}
                    >
                      <header className={styles.sectionCardHeading}>
                        <h2>{localizeTimelineText(item.commentTitle, language)}</h2>
                      </header>
                      <p className="break-words whitespace-pre-wrap">
                        {localizeTimelineText(item.comment, language)}
                      </p>
                    </section>
                  ) : null}
                  {(() => {
                    const filteredDetails = (item.transferDetails || []).filter(
                      (detail) => !hideBankDetails || !isBankDetail(detail),
                    );
                    const hasDetails = filteredDetails.length > 0;
                    const isTransferStatus = item.action.includes("โอนเงิน");
                    const hasSlipButton = isTransferStatus && Boolean(onShowTransferSlip);
                    const hasConfirmReceiptButton = isTransferStatus && Boolean(onConfirmReceipt);
                    const hasDownloadButton = isTransferStatus && Boolean(onDownloadRequest);

                    if (!hasDetails && !hasSlipButton && !hasConfirmReceiptButton && !hasDownloadButton) {
                      return null;
                    }

                    return (
                      <>
                        {hasDetails ? (
                          <dl className={styles.transferDetails}>
                            {filteredDetails.map((detail, dIdx) => {
                              const { label, value } = splitTransferDetail(detail, language);
                              return (
                                <Fragment key={dIdx}>
                                  <dt>{label}</dt>
                                  <dd>{value}</dd>
                                </Fragment>
                              );
                            })}
                          </dl>
                        ) : null}
                        {hasSlipButton || hasConfirmReceiptButton || hasDownloadButton ? (
                          <div
                            className={`${styles.loanTimelineActions} ${
                              hasSlipButton && (hasConfirmReceiptButton || hasDownloadButton)
                                ? ""
                                : styles.loanTimelineActionsSingle
                            }`}
                          >
                            {hasSlipButton ? (
                              <button
                                className={styles.outlineOrangeButton}
                                onClick={onShowTransferSlip}
                                type="button"
                              >
                                <FileText aria-hidden="true" size={18} />
                                {t("ดูหลักฐาน", "View proof")}
                              </button>
                            ) : null}
                            {hasDownloadButton ? (
                              <button
                                className={`${styles.loanApplicationNext} ${styles.loanDownloadRequestButton}`}
                                onClick={onDownloadRequest}
                                type="button"
                              >
                                <Download aria-hidden="true" size={18} />
                                {t("ดาวน์โหลดแบบคำร้อง", "Download request")}
                              </button>
                            ) : null}
                            {hasConfirmReceiptButton ? (
                              <button
                                className={`${styles.loanApplicationNext} ${styles.loanDownloadRequestButton}`}
                                onClick={onConfirmReceipt}
                                type="button"
                              >
                                <CheckCircle2 aria-hidden="true" size={18} />
                                {t("ยืนยันการรับเงิน", "Confirm receipt")}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.emptyDashboardState}>
          <span aria-hidden="true" className={styles.emptyDashboardStateIcon}>
            <Clock3 size={24} strokeWidth={2} />
          </span>
          <p>{emptyTitle ?? t("ยังไม่มีประวัติการดำเนินการ", "No activity yet")}</p>
          {emptyDescription ? <span>{emptyDescription}</span> : null}
        </div>
      )}

      {footer}

      {/* Modal ดูประวัติการดำเนินการทั้งหมด */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm"
          {...modalDismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-[#ea580c] p-2 rounded-xl shrink-0">
                  <History size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2
                    id="history-modal-title"
                    className="text-base sm:text-lg font-bold text-gray-900 leading-tight"
                  >
                    {t("ประวัติการดำเนินการทั้งหมด", "Full activity log")}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
                aria-label={t("ปิด", "Close")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {fullHistory.length > 0 ? (
                <div className="space-y-4">
                  {fullHistory.map((item, index) => {
                    const badge = getStatusBadgeConfig(item.statusType, language);

                    return (
                      <div
                        key={`${item.action}-${index}`}
                        className="relative pl-6 pb-4 last:pb-0 border-l-2 border-gray-200 last:border-l-transparent ml-2"
                      >
                        {/* Timeline dot */}
                        <span
                          aria-hidden="true"
                          className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ring-gray-200 flex items-center justify-center ${badge.dotClass}`}
                        />

                        <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-3.5 space-y-2.5">
                          <div className="space-y-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold border ${badge.badgeClass}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                            <strong className="block text-sm text-gray-900 font-bold">
                              {localizeTimelineText(item.action, language)}
                            </strong>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {localizeTimelineText(item.date, language)}
                            </span>
                          </div>

                          {item.actor && (
                            <p className="text-sm text-gray-600">
                              <span className="text-gray-400">{t("ดำเนินการโดย:", "Handled by:")}</span>{" "}
                              {localizeActor(item.actor, item.actorEn)}
                            </p>
                          )}

                          {item.comment && (
                            <div
                              className={`p-3 rounded-lg text-sm leading-relaxed break-words whitespace-pre-wrap ${
                                item.statusType === "approved"
                                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                  : item.statusType === "rejected"
                                  ? "bg-red-50 border border-red-200 text-red-800"
                                  : item.statusType === "returned"
                                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                                    : "bg-white border border-gray-200 text-gray-700"
                              }`}
                            >
                              {item.commentTitle && (
                                <div className="mb-1 text-sm font-semibold opacity-80">
                                  {localizeTimelineText(item.commentTitle, language)}:
                                </div>
                              )}
                              <p>{localizeTimelineText(item.comment, language)}</p>
                            </div>
                          )}

                          {item.transferDetails && item.transferDetails.length > 0 && (
                            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-sm text-blue-800">
                              <div className="mb-1 font-semibold text-blue-800">
                                {t("รายละเอียดการโอนเงิน:", "Transfer details:")}
                              </div>
                              <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 text-sm text-blue-800">
                                {item.transferDetails.map((detail, dIdx) => {
                                  const { label, value } = splitTransferDetail(detail, language);
                                  return (
                                    <Fragment key={dIdx}>
                                      <dt>{label}:</dt>
                                      <dd
                                        className="min-w-0 break-words"
                                        style={{ color: "#1e40af" }}
                                      >
                                        {value}
                                      </dd>
                                    </Fragment>
                                  );
                                })}
                              </dl>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t("ยังไม่มีประวัติการดำเนินการ", "No activity yet")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
