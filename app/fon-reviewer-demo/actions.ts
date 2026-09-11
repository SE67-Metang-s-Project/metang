"use server";

import { getCmuSession } from "@/lib/cmu-auth";
import { sendLineNotification, LineNotificationError } from "@/lib/line-notification";
import { buildReviewerNotificationPayload } from "@/lib/line-notification-template";
import {
  getLoanRoutingIds,
  getAdvisorRecipientEmail,
  getAdminRecipientEmails,
  getExecutiveRecipientEmail,
} from "@/db/queries/notification-recipients";
import { buildReviewerRequestUrl, type ReviewerRole } from "@/lib/reviewer-deeplink";

export type FonReviewerDemoState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendDemoReviewerNotification(
  _previousState: FonReviewerDemoState,
  formData: FormData,
): Promise<FonReviewerDemoState> {
  const session = await getCmuSession();

  if (!session) {
    return { status: "error", message: "กรุณาเข้าสู่ระบบก่อนส่งการแจ้งเตือน" };
  }

  const role = readField(formData, "role") as ReviewerRole;
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
    let recipientEmails: string[] = [];
    if (role === "advisor") {
      if (!loanId) {
        return { status: "error", message: "กรุณาระบุเลขที่คำร้อง" };
      }
      const routing = await getLoanRoutingIds(loanId);
      if (!routing) {
        return { status: "error", message: "ไม่พบคำร้องนี้" };
      }
      if (!routing.advisorId) {
        return { status: "error", message: "ไม่พบข้อมูลอาจารย์ที่ปรึกษาสำหรับคำร้องนี้" };
      }
      const advisorEmail = await getAdvisorRecipientEmail(routing.advisorId);
      if (!advisorEmail) {
        return { status: "error", message: "ไม่พบข้อมูลติดต่ออาจารย์ที่ปรึกษา" };
      }
      recipientEmails = [advisorEmail];
    } else if (role === "admin") {
      if (!loanId) {
        return { status: "error", message: "กรุณาระบุเลขที่คำร้อง" };
      }
      const routing = await getLoanRoutingIds(loanId);
      if (!routing) {
        return { status: "error", message: "ไม่พบคำร้องนี้" };
      }
      const adminEmails = await getAdminRecipientEmails(routing.assignedAdminId);
      if (!adminEmails || adminEmails.length === 0) {
        return { status: "error", message: "ไม่พบผู้ดูแลระบบที่สามารถแจ้งเตือนได้" };
      }
      recipientEmails = adminEmails;
    } else if (role === "executive") {
      const execEmail = await getExecutiveRecipientEmail();
      if (!execEmail) {
        return { status: "error", message: "ยังไม่มีผู้บริหารที่ได้รับมอบหมาย" };
      }
      recipientEmails = [execEmail];
    } else {
      return { status: "error", message: "ระบุบทบาทผู้ตรวจสอบไม่ถูกต้อง" };
    }

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
      "[fon-reviewer-demo] dry run, not sending:",
      JSON.stringify(payloads, null, 2),
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
