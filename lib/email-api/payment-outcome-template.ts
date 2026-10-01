import { REMINDER_SYSTEM_NAME, validateStudentEmail } from "./loan-reminder-template";
import { SendEmailPayload } from "./types";

export type PaymentOutcomeEmailInput = {
  outcome: "confirmed" | "rejected";
  studentName: string;
  studentEmail: string;
  amount: number;
  loanId: string;
  /** The reviewer's reason. Always present on a rejection, since rejecting requires a note. */
  reviewNote: string | null;
  loanDetailUrl: string;
};

/**
 * The student's notice that an Admin confirmed or rejected their repayment slip. Carries only the
 * amount, the loan id, and on a rejection the reviewer's reason - never the slip, its storage path,
 * or any bank data.
 */
export function buildPaymentOutcomeEmail(input: PaymentOutcomeEmailInput): SendEmailPayload {
  validateStudentEmail(input.studentEmail);

  const formattedAmount = input.amount.toLocaleString("th-TH");
  const confirmed = input.outcome === "confirmed";

  const subject = confirmed
    ? `ยืนยันการชำระเงินกู้ยืม รหัสสัญญา ${input.loanId}`
    : `หลักฐานการชำระเงินกู้ยืมไม่ผ่านการตรวจสอบ รหัสสัญญา ${input.loanId}`;

  const body = confirmed
    ? [
        `ผู้ดูแลระบบได้ตรวจสอบและยืนยันการชำระเงินจำนวน ${formattedAmount} บาท แล้ว`,
        `รหัสสัญญา: ${input.loanId}`,
      ]
    : [
        `หลักฐานการชำระเงินจำนวน ${formattedAmount} บาท ไม่ผ่านการตรวจสอบ`,
        `รหัสสัญญา: ${input.loanId}`,
        `เหตุผล: ${input.reviewNote?.trim() || "-"}`,
        "",
        "กรุณาส่งหลักฐานการชำระเงินใหม่ก่อนวันครบกำหนดชำระ",
      ];

  const message = [
    `เรียน ${input.studentName}`,
    "",
    ...body,
    "",
    `ท่านสามารถตรวจสอบรายละเอียดได้ที่: ${input.loanDetailUrl}`,
    "",
    "ขอแสดงความนับถือ",
  ].join("\n");

  return {
    subject,
    sentTo: input.studentEmail,
    message,
    systemName: REMINDER_SYSTEM_NAME,
  };
}
