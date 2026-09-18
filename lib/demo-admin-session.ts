import { isDevelopmentEnvironment } from "@/lib/development-access";
import { getAdminAccess, type LoanUserContext } from "@/lib/loan-auth";

export function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function requireDemoAdminSession(): Promise<
  { ok: true; context: LoanUserContext } | { ok: false; message: string }
> {
  if (!isDevelopmentEnvironment()) {
    return { ok: false, message: "ไม่พร้อมใช้งานในระบบนี้" };
  }
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return { ok: false, message: "ต้องเป็นผู้ดูแลระบบจึงจะส่งการแจ้งเตือนทดสอบได้" };
  }

  if (!access.context.session) {
    return { ok: false, message: "กรุณาเข้าสู่ระบบก่อนส่งการแจ้งเตือน" };
  }

  return { ok: true, context: access.context };
}
