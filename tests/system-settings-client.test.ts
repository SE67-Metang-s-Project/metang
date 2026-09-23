import test from "node:test";
import assert from "node:assert/strict";
import { systemSettingErrorMessage } from "../lib/system-settings-client";

test("a 422 names the field the settings route rejected", () => {
  assert.equal(systemSettingErrorMessage(422, "contactPhone is invalid"), "เบอร์โทรศัพท์ไม่ถูกต้อง");
  assert.equal(systemSettingErrorMessage(422, "contactEmail is invalid"), "อีเมลไม่ถูกต้อง");
  assert.equal(systemSettingErrorMessage(422, "bankName is required"), "ชื่อธนาคารไม่ถูกต้อง");
  assert.match(systemSettingErrorMessage(422, "at least one field is required"), /ตรวจสอบอีกครั้ง/);
  assert.match(systemSettingErrorMessage(422, "constructor is invalid"), /ตรวจสอบอีกครั้ง/);
});

test("auth, conflict and server errors map to Thai messages", () => {
  assert.match(systemSettingErrorMessage(401), /เข้าสู่ระบบใหม่/);
  assert.match(systemSettingErrorMessage(403), /ไม่มีสิทธิ์/);
  assert.match(systemSettingErrorMessage(409), /ลองใหม่/);
  assert.match(systemSettingErrorMessage(500), /ไม่สำเร็จ/);
});
