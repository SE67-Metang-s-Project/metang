import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("SettingPage merges bank and address into a single 'ข้อมูลและการติดต่อ' tab", () => {
  const settingPageContent = read("components/superadmin/setting/SettingPage.tsx");

  // SettingPage must have 3 tabs: users, budget, contact
  assert.ok(
    settingPageContent.includes('setActiveTab("users")'),
    "SettingPage must have 'ผู้ใช้และบทบาท' tab",
  );
  assert.ok(
    settingPageContent.includes('setActiveTab("budget")'),
    "SettingPage must have 'วงเงินระบบ' tab",
  );
  assert.ok(
    settingPageContent.includes('setActiveTab("contact")'),
    "SettingPage must have 'ข้อมูลและการติดต่อ' tab",
  );

  // Must not have separate 'bank' or 'address' tab buttons
  assert.ok(
    !settingPageContent.includes('setActiveTab("bank")'),
    "SettingPage must not have separate 'bank' tab button",
  );
  assert.ok(
    !settingPageContent.includes('setActiveTab("address")'),
    "SettingPage must not have separate 'address' tab button",
  );

  // Tab text must be "ข้อมูลและการติดต่อ"
  assert.ok(
    settingPageContent.includes("ข้อมูลและการติดต่อ"),
    "SettingPage must display tab title 'ข้อมูลและการติดต่อ'",
  );

  // Must render SystemContactInfoTab
  assert.ok(
    settingPageContent.includes("<SystemContactInfoTab />"),
    "SettingPage must render SystemContactInfoTab",
  );
});

test("SystemContactInfoTab contains required bank and contact fields with fixed faculty name and student bank options", () => {
  const contactTabContent = read("components/superadmin/setting/SystemContactInfoTab.tsx");

  // 1. Bank section fields:
  // - ชื่อธนาคาร
  assert.ok(contactTabContent.includes("ชื่อธนาคาร"), "Must have ชื่อธนาคาร");
  // - ชื่อเลขบัญชี
  assert.ok(
    contactTabContent.includes("ชื่อเลขบัญชี") || contactTabContent.includes("ชื่อบัญชี"),
    "Must have ชื่อเลขบัญชี",
  );
  // - หมายเลขบัญชี
  assert.ok(contactTabContent.includes("หมายเลขบัญชี"), "Must have หมายเลขบัญชี");

  // - Must use student receiving bank account options (tempLoanFormOptions.banks)
  assert.ok(
    contactTabContent.includes("tempLoanFormOptions.banks"),
    "Must import and use student receiving bank account options from tempLoanFormOptions.banks",
  );
  assert.ok(
    contactTabContent.includes("studentBankOptions"),
    "Must map over studentBankOptions",
  );

  // 2. Address / Contact section fields:
  // - ข้อมูลคณะและหน่วยงานสังกัด fixed to "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่" and read-only/disabled
  assert.ok(
    contactTabContent.includes("คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่"),
    "Must contain fixed faculty name 'คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่'",
  );
  assert.match(
    contactTabContent,
    /value=\{FIXED_FACULTY_NAME\}[\s\S]*?(readOnly|disabled)/,
    "Faculty name must be fixed and non-editable (readOnly / disabled)",
  );

  // - จุดติดต่อเจ้าหน้าที่ (TH - EN)
  assert.ok(
    contactTabContent.includes("จุดติดต่อเจ้าหน้าที่ (ภาษาไทย)"),
    "Must have จุดติดต่อเจ้าหน้าที่ ภาษาไทย",
  );
  assert.ok(
    contactTabContent.includes("Contact Location (English)"),
    "Must have Contact Location English",
  );

  // - เบอร์โทรศัพท์หลัก
  assert.ok(contactTabContent.includes("เบอร์โทรศัพท์หลัก"), "Must have เบอร์โทรศัพท์หลัก");

  // - เบอร์ต่อภายใน (Ext.)
  assert.ok(contactTabContent.includes("เบอร์ต่อภายใน (Ext.)"), "Must have เบอร์ต่อภายใน (Ext.)");

  // - อีเมลติดต่อทางการ
  assert.ok(contactTabContent.includes("อีเมลติดต่อทางการ"), "Must have อีเมลติดต่อทางการ");

  // - วันทำการ
  assert.ok(contactTabContent.includes("วันทำการ (ภาษาไทย)"), "Must have วันทำการ ภาษาไทย");
  assert.ok(contactTabContent.includes("Working Days"), "Must have Working Days English");

  // - เวลาทำการ
  assert.ok(contactTabContent.includes("เวลาทำการ (ภาษาไทย)"), "Must have เวลาทำการ ภาษาไทย");
  assert.ok(contactTabContent.includes("Working Hours"), "Must have Working Hours English");

  // - หมายเหตุวันหยุด
  assert.ok(contactTabContent.includes("หมายเหตุวันหยุด"), "Must have หมายเหตุวันหยุด");

  // 3. Must save both bank and contact info to saveSystemSetting
  assert.match(
    contactTabContent,
    /saveSystemSetting\(\{[\s\S]*?bankName[\s\S]*?accountName[\s\S]*?accountNumber[\s\S]*?contactLocationTh[\s\S]*?contactPhone[\s\S]*?contactEmail/,
    "saveSystemSetting must receive both bank and contact fields",
  );
});
