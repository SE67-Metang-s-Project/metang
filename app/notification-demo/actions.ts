"use server";

import { getProfileEmail } from "@/lib/cmu-auth";
import {
  LineNotificationError,
  sendLineNotification,
} from "@/lib/line-notification";
import { requireDemoAdminSession, readField } from "@/lib/demo-admin-session";

export type NotificationDemoState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function sendDemoNotification(
  _previousState: NotificationDemoState,
  formData: FormData,
): Promise<NotificationDemoState> {
  const gate = await requireDemoAdminSession();
  if (!gate.ok) {
    return { status: "error", message: gate.message };
  }
  const context = gate.context;

  const email = getProfileEmail(context.session.profile);

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
