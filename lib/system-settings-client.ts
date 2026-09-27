// Browser-side access to the system_setting row for the SuperAdmin settings tabs. The row holds the
// student-facing bank account and contact block; see db/queries/system-settings.ts.

export type StoredSystemSetting = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  contactLocationTh: string;
  contactLocationEn: string | null;
  contactPhone: string;
  contactExt: string | null;
  contactEmail: string;
};

export type SystemSettingPatch = Partial<StoredSystemSetting>;

const fieldMessages: Record<string, string> = {
  bankName: "ชื่อธนาคารไม่ถูกต้อง",
  accountName: "ชื่อบัญชีไม่ถูกต้อง",
  accountNumber: "เลขที่บัญชีไม่ถูกต้อง",
  contactLocationTh: "จุดติดต่อ (ภาษาไทย) ไม่ถูกต้อง",
  contactLocationEn: "จุดติดต่อ (ภาษาอังกฤษ) ไม่ถูกต้อง",
  contactPhone: "เบอร์โทรศัพท์ไม่ถูกต้อง",
  contactExt: "เบอร์ภายในไม่ถูกต้อง",
  contactEmail: "อีเมลไม่ถูกต้อง",
};

export function systemSettingErrorMessage(status: number, apiMessage?: string | null): string {
  if (status === 401) return "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
  if (status === 403) return "ไม่มีสิทธิ์แก้ไขการตั้งค่าระบบ";
  if (status === 409) return "ข้อมูลมีการเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง";
  if (status === 422) {
    // parseSystemSettingPatch errors start with the field name, e.g. "contactPhone is invalid".
    const field = apiMessage?.split(" ", 1)[0] ?? "";
    return Object.hasOwn(fieldMessages, field)
      ? fieldMessages[field]
      : "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
  }
  return "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่";
}

export async function fetchSystemSetting(): Promise<StoredSystemSetting> {
  const res = await fetch("/api/super-admin/settings");
  if (!res.ok) throw new Error(`Unable to load system settings (${res.status})`);
  return (await res.json()).data as StoredSystemSetting;
}

/** Resolves to null on success, or a Thai message for the failure. */
export async function saveSystemSetting(patch: SystemSettingPatch): Promise<string | null> {
  try {
    const res = await fetch("/api/super-admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) return null;
    const body = await res.json().catch(() => null);
    return systemSettingErrorMessage(res.status, body?.error?.message);
  } catch {
    return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง";
  }
}
