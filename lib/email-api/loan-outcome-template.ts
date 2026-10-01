import { REMINDER_SYSTEM_NAME, validateStudentEmail } from "./loan-reminder-template";
import { SendEmailPayload } from "./types";

type RejectedBy = "advisor" | "admin" | "executive";

const REJECTED_BY_TH: Record<RejectedBy, string> = {
  advisor: "อาจารย์ที่ปรึกษา",
  admin: "ผู้ดูแลระบบกองทุน",
  executive: "ผู้บริหาร",
};

export type LoanOutcomeEmailInput = {
  studentName: string;
  studentEmail: string;
  loanId: string;
  loanDetailUrl: string;
} & (
  | {
      outcome: "disbursed";
      amount: number;
      installmentCount: number;
      firstDueDate: Date;
      firstInstallmentAmount: number;
    }
  | {
      outcome: "rejected";
      rejectedBy: RejectedBy | null;
      reason: string | null;
    }
);

function formatThaiDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * The student's notice that their loan was disbursed or their request was rejected. Carries the
 * loan id, amounts, the repayment schedule start, and on a rejection the reviewer's reason - never
 * the transfer slip, its storage path, or any bank account data.
 */
export function buildLoanOutcomeEmail(input: LoanOutcomeEmailInput): SendEmailPayload {
  validateStudentEmail(input.studentEmail);

  let subject: string;
  let body: string[];
  if (input.outcome === "disbursed") {
    subject = `โอนเงินกู้ยืมเรียบร้อยแล้ว รหัสสัญญา ${input.loanId}`;
    body = [
      `ผู้ดูแลระบบได้โอนเงินกู้ยืมจำนวน ${input.amount.toLocaleString("th-TH")} บาท ให้ท่านเรียบร้อยแล้ว`,
      `รหัสสัญญา: ${input.loanId}`,
      "",
      `การชำระคืนมีทั้งหมด ${input.installmentCount} งวด`,
      `งวดที่ 1 จำนวน ${input.firstInstallmentAmount.toLocaleString("th-TH")} บาท กำหนดชำระภายในวันที่ ${formatThaiDate(input.firstDueDate)}`,
    ];
  } else {
    subject = `คำร้องขอกู้ยืมไม่ได้รับการอนุมัติ รหัสสัญญา ${input.loanId}`;
    body = [
      input.rejectedBy
        ? `คำร้องขอกู้ยืมของท่านไม่ได้รับการอนุมัติจาก${REJECTED_BY_TH[input.rejectedBy]}`
        : "คำร้องขอกู้ยืมของท่านไม่ได้รับการอนุมัติ",
      `รหัสสัญญา: ${input.loanId}`,
      `เหตุผล: ${input.reason?.trim() || "-"}`,
      "",
      "หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่กองทุน",
    ];
  }

  const message = [
    `เรียน ${input.studentName}`,
    "",
    ...body,
    "",
    `ท่านสามารถตรวจสอบรายละเอียดได้ที่: ${input.loanDetailUrl}`,
    "",
    "ขอแสดงความนับถือ",
  ].join("\n");

  return { subject, sentTo: input.studentEmail, message, systemName: REMINDER_SYSTEM_NAME };
}
