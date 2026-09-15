import type { LineNotificationPayload } from "./line-notification";
import type { ReviewerRole } from "./reviewer-deeplink";
import type { LoanStatus } from "@/lib/generated/prisma/client";

export const FON_PROGRAM_NAME = "ระบบเงินกู้ยืม MeTang";

export const REVIEWER_NOTIFICATION_COLOR: Readonly<Record<ReviewerRole, string>> = {
  advisor: "#2563EB",
  admin: "#F59E0B",
  super_admin: "#F59E0B",
  executive: "#7C3AED",
};

export type ReviewerNotificationStep = {
  role: ReviewerRole;
  /** Deep-link target for this status - not always the role's default queue (see below). */
  path: string;
  eventLabel: string;
};

/**
 * Which reviewer is waiting, where their deep link should point, and what to say - keyed by
 * loan status, not role. pending_admin and pending_disbursement are both "admin", but they need
 * different pages (review queue vs. disbursement queue), so a role-keyed map can't express this.
 * Statuses with no reviewer step (draft, returned, disbursed, closed, rejected, cancelled) are
 * intentionally absent - the caller must treat a missing entry as "nothing to notify".
 */
export const REVIEWER_STEP_BY_STATUS: Readonly<Partial<Record<LoanStatus, ReviewerNotificationStep>>> = {
  pending_advisor: {
    role: "advisor",
    path: "/advisor/pending",
    eventLabel: "มีคำร้องใหม่รอการตรวจสอบ",
  },
  pending_admin: {
    role: "admin",
    path: "/admin/pending",
    eventLabel: "มีคำร้องรอการพิจารณาจากเจ้าหน้าที่",
  },
  pending_executive: {
    role: "executive",
    path: "/executive/pending-executive",
    eventLabel: "มีคำร้องรอการอนุมัติจากผู้บริหาร",
  },
  pending_disbursement: {
    role: "admin",
    path: "/admin/disburse-debt",
    eventLabel: "มีคำร้องรอการโอนเงิน",
  },
};

export type ReviewerNotificationInput = {
  role: ReviewerRole;
  recipientEmail: string;
  requestId: string;
  studentName: string;
  amount: number;
  eventLabel: string;
  deepLinkUrl: string;
};

export function buildReviewerNotificationPayload(
  input: ReviewerNotificationInput,
): LineNotificationPayload {
  const message = [
    input.eventLabel,
    `เลขที่คำร้อง: ${input.requestId}`,
    `ชื่อนักศึกษา: ${input.studentName}`,
    `จำนวนเงิน: ${input.amount.toLocaleString("th-TH")} บาท`,
  ].join("\n");

  return {
    program: FON_PROGRAM_NAME,
    email: input.recipientEmail,
    message,
    weblink: input.deepLinkUrl,
    color: REVIEWER_NOTIFICATION_COLOR[input.role],
  };
}
