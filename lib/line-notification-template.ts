import type { LineNotificationPayload } from "./line-notification";
import type { ReviewerRole } from "./reviewer-deeplink";

export const FON_PROGRAM_NAME = "ระบบเงินกู้ยืม MeTang";

export const REVIEWER_NOTIFICATION_COLOR: Readonly<Record<ReviewerRole, string>> = {
  advisor: "#2563EB",
  admin: "#F59E0B",
  super_admin: "#F59E0B",
  executive: "#7C3AED",
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
