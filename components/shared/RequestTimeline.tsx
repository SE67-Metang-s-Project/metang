"use client";

import React, { Fragment, useState } from "react";
import {
  Clock3,
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

function getStatusBadgeConfig(statusType: FullActionHistoryItem["statusType"]) {
  switch (statusType) {
    case "submitted":
      return {
        label: "ยื่นคำร้อง",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <FileText size={13} className="shrink-0" />,
        dotClass: "bg-blue-500",
      };
    case "resubmitted":
      return {
        label: "ส่งการแก้ไข",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <Pencil size={13} className="shrink-0" />,
        dotClass: "bg-indigo-500",
      };
    case "returned":
      return {
        label: "ส่งกลับแก้ไข",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <RotateCcw size={13} className="shrink-0" />,
        dotClass: "bg-amber-500",
      };
    case "approved":
      return {
        label: "เห็นชอบ/อนุมัติ",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 size={13} className="shrink-0" />,
        dotClass: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: "ไม่อนุมัติ",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle size={13} className="shrink-0" />,
        dotClass: "bg-red-500",
      };
    case "disbursed":
      return {
        label: "โอนเงินเรียบร้อย",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
        icon: <HandCoins size={13} className="shrink-0" />,
        dotClass: "bg-teal-500",
      };
    case "cancelled":
      return {
        label: "ยกเลิกคำร้อง",
        badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <Ban size={13} className="shrink-0" />,
        dotClass: "bg-gray-500",
      };
    case "pending":
    default:
      return {
        label: "กำลังดำเนินการ",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <Clock size={13} className="shrink-0" />,
        dotClass: "bg-orange-400",
      };
  }
}

export interface RequestTimelineProps {
  history?: ActionHistory[];
  approvals?: ApprovalStep[];
  requestStatus?: string;
  bankDetails?: BankDetails;
  advisorName?: string;
  studentName?: string;
  submitDate?: string;
  title?: string;
  className?: string;
  onShowTransferSlip?: () => void;
  hideComments?: boolean;
  hideBankDetails?: boolean;
}

export default function RequestTimeline({
  history = [],
  approvals = [],
  requestStatus,
  bankDetails,
  advisorName,
  studentName,
  submitDate,
  title = "ติดตามสถานะคำร้อง",
  className = "",
  onShowTransferSlip,
  hideComments = false,
  hideBankDetails = false,
}: RequestTimelineProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const modalDismiss = useModalDismiss({
    onClose: () => setIsHistoryModalOpen(false),
    isOpen: isHistoryModalOpen,
  });

  const timelineItems = buildFiveStepTimeline({
    history,
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

  const hasItems = timelineItems.length > 0;

  return (
    <section className={`${styles.loanApprovalInfoCard} ${className}`}>
      <CardHeader
        className={styles.sectionCardHeading}
        icon={<Clock3 aria-hidden="true" size={20} strokeWidth={2.2} />}
        title={title}
        action={
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="ดูประวัติการดำเนินการทั้งหมด"
            aria-label="ดูประวัติการดำเนินการทั้งหมด"
          >
            <History aria-hidden="true" size={14} strokeWidth={2.2} />
            <span className="hidden sm:inline">ดูประวัติการดำเนินการทั้งหมด</span>
            <span className="sm:hidden">ดูประวัติทั้งหมด</span>
          </button>
        }
      />
      {hasItems ? (
        <ol className={styles.loanTimeline}>
          {timelineItems.map((item, index) => {
            const isRevisionItem = Boolean(item.isRevision);
            const isFailed = Boolean(item.isFailed);
            const isPending = Boolean(item.isPending);
            const isUpcoming = Boolean(item.isUpcoming);

            return (
              <li className={styles.loanTimelineItem} key={`${item.action}-${index}`}>
                <span
                  aria-hidden="true"
                  className={`${styles.timelineMarker} ${
                    isPending ? styles.timelineMarkerPending : ""
                  } ${isUpcoming ? styles.timelineMarkerUpcoming : ""} ${
                    isFailed ? styles.timelineMarkerFailed : ""
                  } ${isRevisionItem ? styles.timelineMarkerRevision : ""}`}
                >
                  {isRevisionItem ? <Pencil size={13} strokeWidth={2.8} /> : null}
                </span>
                <div className={styles.timelineContent}>
                  <strong>{item.action}</strong>
                  <p>
                    {item.date}
                    {item.actor ? ` · โดย ${item.actor}` : ""}
                  </p>
                  {!hideComments && item.commentTitle && item.comment ? (
                    <section
                      className={`${styles.detailDashboardCard} ${styles.timelineCommentCard} ${
                        isFailed ? styles.timelineCommentCardRejected : ""
                      }`}
                    >
                      <header className={styles.sectionCardHeading}>
                        <h2>{item.commentTitle}</h2>
                      </header>
                      <p className="break-words whitespace-pre-wrap">{item.comment}</p>
                    </section>
                  ) : null}
                  {(() => {
                    const filteredDetails = (item.transferDetails || []).filter(
                      (detail) => !hideBankDetails || !isBankDetail(detail),
                    );
                    const hasDetails = filteredDetails.length > 0;
                    const hasSlipButton = Boolean(onShowTransferSlip);

                    if (!hasDetails && !hasSlipButton) return null;

                    return (
                      <>
                        {hasDetails ? (
                          <dl className={styles.transferDetails}>
                            {filteredDetails.map((detail, dIdx) => {
                              const colonIndex = detail.indexOf(":");
                              if (colonIndex === -1) {
                                return (
                                  <Fragment key={dIdx}>
                                    <dt>{detail}</dt>
                                    <dd></dd>
                                  </Fragment>
                                );
                              }
                              return (
                                <Fragment key={dIdx}>
                                  <dt>{detail.slice(0, colonIndex)}</dt>
                                  <dd>{detail.slice(colonIndex + 1).trim()}</dd>
                                </Fragment>
                              );
                            })}
                          </dl>
                        ) : null}
                        {hasSlipButton ? (
                          <div
                            className={`${styles.loanTimelineActions} ${styles.loanTimelineActionsSingle}`}
                          >
                            <button
                              className={styles.outlineOrangeButton}
                              onClick={onShowTransferSlip}
                              type="button"
                            >
                              <FileText aria-hidden="true" size={18} />
                              ดูหลักฐาน
                            </button>
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
        <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mt-2">
          <p className="text-[13px] text-gray-500">ยังไม่มีประวัติการดำเนินการ</p>
        </div>
      )}

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
                    ประวัติการดำเนินการทั้งหมด
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {studentName
                      ? `นักศึกษา: ${studentName}`
                      : "บันทึกการยื่นคำร้อง การส่งแก้ไข และการพิจารณา"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {fullHistory.length > 0 ? (
                <div className="space-y-4">
                  {fullHistory.map((item, index) => {
                    const badge = getStatusBadgeConfig(item.statusType);

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
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.badgeClass}`}
                              >
                                {badge.icon}
                                {badge.label}
                              </span>
                              <strong className="text-sm text-gray-900 font-bold">
                                {item.action}
                              </strong>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {item.date}
                            </span>
                          </div>

                          {item.actor && (
                            <p className="text-xs text-gray-600">
                              <span className="text-gray-400">ดำเนินการโดย:</span> {item.actor}
                            </p>
                          )}

                          {item.comment && (
                            <div
                              className={`p-3 rounded-lg text-xs leading-relaxed break-words whitespace-pre-wrap ${
                                item.statusType === "rejected"
                                  ? "bg-red-50 border border-red-200 text-red-800"
                                  : item.statusType === "returned"
                                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                                    : "bg-white border border-gray-200 text-gray-700"
                              }`}
                            >
                              {item.commentTitle && (
                                <div className="font-semibold mb-1 text-[11px] uppercase tracking-wider opacity-80">
                                  {item.commentTitle}
                                </div>
                              )}
                              <p>{item.comment}</p>
                            </div>
                          )}

                          {item.transferDetails && item.transferDetails.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 space-y-1">
                              <div className="font-semibold text-gray-700 mb-1">
                                รายละเอียดการโอนเงิน:
                              </div>
                              {item.transferDetails.map((detail, dIdx) => (
                                <div key={dIdx} className="text-[11px] text-gray-600">
                                  {detail}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  ยังไม่มีประวัติการดำเนินการ
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
