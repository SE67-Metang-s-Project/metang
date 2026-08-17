"use server";

import { getCmuSession } from "@/lib/cmu-auth";
import {
  LineNotificationError,
  sendLineNotification,
} from "@/lib/line-notification";

export type NotificationDemoState = {
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

export async function sendDemoNotification(
  _previousState: NotificationDemoState,
  formData: FormData,
): Promise<NotificationDemoState> {
  const session = await getCmuSession();

  if (!session) {
    return { status: "error", message: "กรุณาเข้าสู่ระบบก่อนส่งการแจ้งเตือน" };
  }

  const email = getProfileEmail(session.profile);

  if (!email) {
    return { status: "error", message: "ไม่พบอีเมลในบัญชี CMU" };
  }

  try {
    await sendLineNotification({
      program: readField(formData, "program"),
      email,
      message: readField(formData, "message"),
      weblink: readField(formData, "weblink"),
      color: readField(formData, "color"),
    });

    return { status: "success", message: "ส่งการแจ้งเตือนสำเร็จ" };
  } catch (error) {
    if (error instanceof LineNotificationError) {
      return { status: "error", message: error.message };
    }

    console.error("Unable to send LINE notification", error);
    return { status: "error", message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
