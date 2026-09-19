"use server";

import { sendLineNotification, LineNotificationError } from "@/lib/line-notification";
import { buildReviewerNotificationPayload } from "@/lib/line-notification-template";
import { getRecipientEmailsByRole } from "@/db/queries/notification-recipients";
import { buildReviewerRequestUrl, type ReviewerRole } from "@/lib/reviewer-deeplink";
import { requireDemoAdminSession, readField } from "@/lib/demo-admin-session";

const REVIEWER_ROLES: ReviewerRole[] = ["advisor", "admin", "super_admin", "executive"];

export type FonReviewerDemoState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function sendDemoReviewerNotification(
  _previousState: FonReviewerDemoState,
  formData: FormData,
): Promise<FonReviewerDemoState> {
  const gate = await requireDemoAdminSession();
  if (!gate.ok) {
    return { status: "error", message: gate.message };
  }
  const context = gate.context;

  const role = readField(formData, "role") as ReviewerRole;
  if (!REVIEWER_ROLES.includes(role)) {
    return { status: "error", message: "ระบุบทบาทผู้ตรวจสอบไม่ถูกต้อง" };
  }

  const recipientEmail = readField(formData, "recipientEmail");
  if (!recipientEmail) {
    return { status: "error", message: "กรุณาเลือกอีเมลผู้รับ" };
  }

  const loanId = readField(formData, "loanId");
  const studentName = readField(formData, "studentName");

  const amount = Number(readField(formData, "amount"));
  if (!Number.isFinite(amount)) {
    return { status: "error", message: "จำนวนเงินไม่ถูกต้อง" };
  }

  const eventLabel = readField(formData, "eventLabel") || "มีคำร้องใหม่รอการตรวจสอบ";
  const dryRun = readField(formData, "dryRun") === "on";

  let payloads;
  try {
    const roleRecipientEmails = await getRecipientEmailsByRole(role);
    if (!roleRecipientEmails.includes(recipientEmail)) {
      return { status: "error", message: "อีเมลผู้รับไม่ตรงกับบทบาทที่เลือก" };
    }
    const recipientEmails = [recipientEmail];

    const deepLinkUrl = buildReviewerRequestUrl(
      process.env.APP_BASE_URL ?? "http://localhost:8080",
      role,
      loanId || "N/A",
    );

    payloads = recipientEmails.map((email) => {
      const payload = buildReviewerNotificationPayload({
        role,
        recipientEmail: email,
        requestId: loanId || "N/A",
        studentName,
        amount,
        eventLabel,
        deepLinkUrl,
      });
      return { email, payload };
    });
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", message: error.message };
    }
    console.error("Unable to build reviewer notification payload", error);
    return { status: "error", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }

  if (dryRun) {
    console.log(
      "[fon-reviewer-demo] dry run, not sending. Recipient count:",
      payloads.length,
    );
    return {
      status: "success",
      message:
        `Dry run: ${payloads.length} รายการ ดูรายละเอียด payload ได้ที่ server console ` +
        `(${payloads.map(({ email }) => email).join(", ")})`,
    };
  }

  try {
    await Promise.all(
      payloads.map(({ email, payload }) =>
        sendLineNotification(payload, {
          idempotencyKey: `${role}:${loanId || "exec"}:${email}`,
        }),
      ),
    );

    return { status: "success", message: `ส่งการแจ้งเตือนสำเร็จ (${payloads.length} ราย)` };
  } catch (error) {
    if (error instanceof LineNotificationError) {
      return { status: "error", message: error.message };
    }
    console.error("Unable to send demo reviewer notification", error);
    return { status: "error", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
