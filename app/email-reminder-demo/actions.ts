"use server";

import { getCmuSession } from "@/lib/cmu-auth";
import { sendEmail, EmailApiError } from "@/lib/email-api";
import {
  buildLoanDueReminderEmail,
  type LoanDueReminderInput,
} from "@/lib/email-api/loan-reminder-template";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";

export type LoanReminderDemoState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getProfileEmail(profile: Record<string, unknown>) {
  const emailKeys = ["cmuitaccount", "email", "mail", "userPrincipalName"];

  for (const key of emailKeys) {
    const value = profile[key];

    if (typeof value === "string" && value.includes("@")) {
      return value.trim();
    }
  }

  return null;
}

export async function sendDemoLoanReminder(
  _previousState: LoanReminderDemoState,
  formData: FormData,
): Promise<LoanReminderDemoState> {
  const session = await getCmuSession();

  if (!session) {
    return { status: "error", message: "กรุณาเข้าสู่ระบบก่อนส่งการแจ้งเตือน" };
  }

  const email = getProfileEmail(session.profile);

  if (!email) {
    return { status: "error", message: "ไม่พบอีเมลในบัญชี CMU" };
  }

  const studentName = readField(formData, "studentName");

  const installmentSeq = Number(readField(formData, "installmentSeq"));
  if (!Number.isFinite(installmentSeq)) {
    return { status: "error", message: "จำนวนงวดไม่ถูกต้อง" };
  }

  const amountDue = Number(readField(formData, "amountDue"));
  if (!Number.isFinite(amountDue)) {
    return { status: "error", message: "จำนวนเงินไม่ถูกต้อง" };
  }

  const dueDateStr = readField(formData, "dueDate");
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) {
    return { status: "error", message: "วันที่ครบกำหนดไม่ถูกต้อง" };
  }

  const loanId = readField(formData, "loanId");

  let payload;
  try {
    const loanDetailUrl = buildStudentLoanDetailUrl(
      process.env.APP_BASE_URL ?? "http://localhost:8080",
    );
    const input: LoanDueReminderInput = {
      studentName,
      studentEmail: email,
      installmentSeq,
      amountDue,
      dueDate,
      loanId,
      loanDetailUrl,
    };
    payload = buildLoanDueReminderEmail(input);
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", message: error.message };
    }
    console.error("Unable to build loan reminder email payload", error);
    return { status: "error", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }

  try {
    await sendEmail(payload);
    return { status: "success", message: "ส่งอีเมลแจ้งเตือนสำเร็จ" };
  } catch (error) {
    if (error instanceof EmailApiError) {
      return { status: "error", message: error.message };
    }

    console.error("Unable to send loan reminder email", error);
    return { status: "error", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
