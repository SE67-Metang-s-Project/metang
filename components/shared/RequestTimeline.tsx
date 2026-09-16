"use client";

import React, { Fragment } from "react";
import { Clock3, FileText, Pencil } from "lucide-react";
import CardHeader from "@/components/shared/CardHeader";
import styles from "@/app/student/student.module.css";

export type ActionHistory = {
  action: string;
  date: string;
  actor: string;
  commentTitle?: string;
  comment?: string;
  isCompleted?: boolean;
  isPending?: boolean;
  isUpcoming?: boolean;
  isFailed?: boolean;
  isRevision?: boolean;
  transferDetails?: string[];
};

export type ApprovalStep = {
  step: "advisor" | "admin" | "executive";
  actorName: string;
  comment?: string;
  decision: "approved" | "rejected" | "returned" | "pending";
  date?: string;
};

export type BankDetails = {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

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

const isBankDetail = (detail: string) => {
  const d = detail.trim();
  return (
    d.startsWith("ธนาคาร") ||
    d.startsWith("เลขที่บัญชี") ||
    d.startsWith("ชื่อบัญชี")
  );
};

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
  const timelineItems: ActionHistory[] = [];

  // 1. Process items from history
  if (history && history.length > 0) {
    for (const h of history) {
      const action = h.action;
      const isRevision =
        h.isRevision ??
        (action.includes("แก้ไข") || action.includes("ส่งกลับ"));
      const isFailed =
        h.isFailed ??
        (action.includes("ไม่อนุมัติ") ||
          action.includes("ไม่เห็นชอบ") ||
          action.includes("ยกเลิก"));

      let comment = hideComments ? undefined : h.comment;
      let commentTitle = hideComments ? undefined : h.commentTitle;

      // If comment is not explicitly on history item, match with approvals
      if (!hideComments && !comment && approvals && approvals.length > 0) {
        if (
          action.includes("อาจารย์") ||
          h.actor.includes("อาจารย์") ||
          h.actor.includes("อ.")
        ) {
          const app = approvals.find((a) => a.step === "advisor");
          if (app?.comment && app.comment.trim() && app.comment.trim() !== "-") {
            comment = app.comment;
            commentTitle = isRevision
              ? "ข้อความจากอาจารย์ที่ปรึกษา"
              : isFailed
                ? "เหตุผลที่ไม่อนุมัติ"
                : "ความคิดเห็นของอาจารย์ที่ปรึกษา";
          }
        } else if (
          action.includes("เจ้าหน้าที่") ||
          h.actor.includes("เจ้าหน้าที่")
        ) {
          const app = approvals.find((a) => a.step === "admin");
          if (app?.comment && app.comment.trim() && app.comment.trim() !== "-") {
            comment = app.comment;
            commentTitle = isRevision
              ? "ข้อความจากเจ้าหน้าที่"
              : isFailed
                ? "เหตุผลที่ไม่อนุมัติ"
                : "ความคิดเห็นของเจ้าหน้าที่";
          }
        } else if (
          action.includes("ผู้บริหาร") ||
          h.actor.includes("ผู้บริหาร")
        ) {
          const app = approvals.find((a) => a.step === "executive");
          if (app?.comment && app.comment.trim() && app.comment.trim() !== "-") {
            comment = app.comment;
            commentTitle = isRevision
              ? "ข้อความจากผู้บริหาร"
              : isFailed
                ? "เหตุผลที่ไม่อนุมัติ"
                : "ความคิดเห็นของผู้บริหาร";
          }
        }
      }

      let transferDetails = h.transferDetails;
      if (hideBankDetails && transferDetails) {
        transferDetails = transferDetails.filter((d) => !isBankDetail(d));
        if (transferDetails.length === 0) {
          transferDetails = undefined;
        }
      } else if (
        !hideBankDetails &&
        (!transferDetails || transferDetails.length === 0) &&
        action.includes("โอนเงิน") &&
        bankDetails &&
        (bankDetails.bankName || bankDetails.accountNumber || bankDetails.accountName)
      ) {
        transferDetails = [
          `ธนาคาร: ${bankDetails.bankName || "-"}`,
          `เลขที่บัญชี: ${bankDetails.accountNumber || "-"}`,
          `ชื่อบัญชี: ${bankDetails.accountName || "-"}`,
        ];
      }

      timelineItems.push({
        ...h,
        action,
        isRevision,
        isFailed,
        isPending: Boolean(h.isPending),
        isUpcoming: Boolean(h.isUpcoming),
        comment,
        commentTitle,
        transferDetails,
      });
    }
  } else if (submitDate) {
    timelineItems.push({
      action: "ยื่นคำร้องขอกู้ยืม",
      date: submitDate,
      actor: studentName || "นักศึกษา",
      isCompleted: true,
    });
  }

  // 2. Determine if a pending step or disbursement step should be appended
  const hasPendingItem = timelineItems.some((item) => item.isPending);
  const isFinalStatus = [
    "returned",
    "rejected",
    "cancelled",
  ].includes(requestStatus || "");

  if (!hasPendingItem && !isFinalStatus) {
    if (requestStatus === "pending_advisor") {
      timelineItems.push({
        action: "อาจารย์ที่ปรึกษาพิจารณาคำร้อง",
        date: "กำลังดำเนินการ",
        actor: advisorName || "อาจารย์ที่ปรึกษา",
        isPending: true,
      });
    } else if (requestStatus === "pending_admin") {
      timelineItems.push({
        action: "เจ้าหน้าที่ตรวจสอบเอกสาร",
        date: "กำลังดำเนินการ",
        actor: "เจ้าหน้าที่",
        isPending: true,
      });
    } else if (requestStatus === "pending_executive") {
      timelineItems.push({
        action: "ผู้บริหารพิจารณาอนุมัติคำร้อง",
        date: "กำลังดำเนินการ",
        actor: "ผู้บริหาร",
        isPending: true,
      });
    } else if (requestStatus === "pending_disbursement") {
      timelineItems.push({
        action: "เจ้าหน้าที่การเงินดำเนินการโอนเงิน",
        date: "กำลังดำเนินการ",
        actor: "เจ้าหน้าที่การเงิน",
        isPending: true,
      });
    } else if (
      (requestStatus === "disbursed" || requestStatus === "closed") &&
      !timelineItems.some((item) => item.action.includes("โอนเงิน"))
    ) {
      timelineItems.push({
        action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว",
        date: "โอนเงินสำเร็จ",
        actor: "เจ้าหน้าที่การเงิน",
      });
    }
  }

  const hasItems = timelineItems.length > 0;

  return (
    <section className={`${styles.loanApprovalInfoCard} ${className}`}>
      <CardHeader
        className={styles.sectionCardHeading}
        icon={<Clock3 aria-hidden="true" size={20} strokeWidth={2.2} />}
        title={title}
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
                      <p>{item.comment}</p>
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
    </section>
  );
}
