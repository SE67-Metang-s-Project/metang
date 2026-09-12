import { SendEmailPayload } from "./types";

export const REMINDER_SYSTEM_NAME = "MeTang";

export type LoanDueReminderInput = {
  studentName: string;
  studentEmail: string;
  installmentSeq: number;
  amountDue: number;
  dueDate: Date;
  loanId: string;
  loanDetailUrl: string;
};

function validateStudentEmail(studentEmail: string) {
  if (!/^[a-zA-Z0-9._%+-]+@cmu\.ac\.th$/i.test(studentEmail)) {
    throw new Error("studentEmail must be a valid @cmu.ac.th address");
  }
}

export function buildLoanDueReminderEmail(input: LoanDueReminderInput): SendEmailPayload {
  validateStudentEmail(input.studentEmail);

  const formattedDate = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(input.dueDate);

  const formattedAmount = input.amountDue.toLocaleString("th-TH");

  const subject = `แจ้งเตือนกำหนดชำระเงินกู้ยืม งวดที่ ${input.installmentSeq}`;

  const message = [
    `เรียน ${input.studentName}`,
    "",
    `ขอแจ้งเตือนกำหนดชำระเงินกู้ยืม รหัสสัญญา: ${input.loanId}`,
    `งวดที่ ${input.installmentSeq} จำนวนเงินที่ต้องชำระ: ${formattedAmount} บาท`,
    `กำหนดชำระภายในวันที่: ${formattedDate}`,
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
