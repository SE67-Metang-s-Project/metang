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

export function validateStudentEmail(studentEmail: string) {
  if (!/^[a-zA-Z0-9._%+-]+@cmu\.ac\.th$/i.test(studentEmail)) {
    throw new Error("studentEmail must be a valid @cmu.ac.th address");
  }
}

export type LoanOverdueReminderInput = LoanDueReminderInput & { daysOverdue: number };

const formatThaiDate = (date: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

export function buildLoanDueReminderEmail(input: LoanDueReminderInput): SendEmailPayload {
  validateStudentEmail(input.studentEmail);

  const formattedDate = formatThaiDate(input.dueDate);

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

/** Sent after the due date while the installment is still unpaid. */
export function buildLoanOverdueReminderEmail(input: LoanOverdueReminderInput): SendEmailPayload {
  validateStudentEmail(input.studentEmail);

  const subject = `แจ้งเตือนเกินกำหนดชำระเงินกู้ยืม งวดที่ ${input.installmentSeq}`;

  const message = [
    `เรียน ${input.studentName}`,
    "",
    `เงินกู้ยืม รหัสสัญญา: ${input.loanId} งวดที่ ${input.installmentSeq} เกินกำหนดชำระแล้ว ${input.daysOverdue} วัน`,
    `จำนวนเงินที่ค้างชำระ: ${input.amountDue.toLocaleString("th-TH")} บาท`,
    `กำหนดชำระเดิมคือวันที่: ${formatThaiDate(input.dueDate)}`,
    "",
    "กรุณาชำระเงินและส่งหลักฐานการชำระเงินโดยเร็ว",
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
