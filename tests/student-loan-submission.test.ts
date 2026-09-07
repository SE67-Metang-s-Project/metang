import test from "node:test";
import assert from "node:assert/strict";
import { parseLoanInput, parsePhoneNumber } from "../lib/loan-validation";

test("parseLoanInput validates complete and correct submission payloads", () => {
  const validPayload = {
    advisorName: "อาจารย์ที่ปรึกษา ทดสอบ",
    amount: 5000,
    studentYear: 3,
    purpose: "ค่าอุปกรณ์การศึกษาและค่าครองชีพ",
    additionalNote: "มีความจำเป็นเนื่องจากรอเงินโอนจากครอบครัว",
    bankName: "ธนาคารกสิกรไทย",
    bankAccountNo: "1234567890",
    bankAccountName: "สมชาย รักเรียน",
    installmentCount: 2,
  };

  const parsed = parseLoanInput(validPayload);
  assert.equal(parsed.advisorName, "อาจารย์ที่ปรึกษา ทดสอบ");
  assert.equal(parsed.amount, 5000);
  assert.equal(parsed.studentYear, 3);
  assert.equal(parsed.purpose, "ค่าอุปกรณ์การศึกษาและค่าครองชีพ");
  assert.equal(parsed.additionalNote, "มีความจำเป็นเนื่องจากรอเงินโอนจากครอบครัว");
  assert.equal(parsed.bankName, "ธนาคารกสิกรไทย");
  assert.equal(parsed.bankAccountNo, "1234567890");
  assert.equal(parsed.bankAccountName, "สมชาย รักเรียน");
  assert.equal(parsed.installmentCount, 2);
});

test("parseLoanInput rejects invalid installment counts, years, and amounts", () => {
  const base = {
    advisorName: "อาจารย์ที่ปรึกษา ทดสอบ",
    amount: 5000,
    studentYear: 2,
    purpose: "ค่าเทอม",
    additionalNote: null,
    bankName: "ธนาคารกรุงไทย",
    bankAccountNo: "9876543210",
    bankAccountName: "สมหมาย มุ่งมั่น",
    installmentCount: 2,
  };

  // installmentCount < 1 or > 3
  assert.throws(() => parseLoanInput({ ...base, installmentCount: 0 }), /installmentCount is invalid/);
  assert.throws(() => parseLoanInput({ ...base, installmentCount: 4 }), /installmentCount is invalid/);
  assert.throws(() => parseLoanInput({ ...base, installmentCount: 2.5 }), /installmentCount is invalid/);

  // studentYear < 1 or > 4
  assert.throws(() => parseLoanInput({ ...base, studentYear: 0 }), /studentYear is invalid/);
  assert.throws(() => parseLoanInput({ ...base, studentYear: 5 }), /studentYear is invalid/);

  // amount <= 0 or invalid
  assert.throws(() => parseLoanInput({ ...base, amount: 0 }), /amount is invalid/);
  assert.throws(() => parseLoanInput({ ...base, amount: -100 }), /amount is invalid/);
  assert.throws(() => parseLoanInput({ ...base, amount: "5000" }), /amount is invalid/);
});

test("parseLoanInput requires essential text fields", () => {
  const base = {
    advisorName: "อาจารย์ที่ปรึกษา ทดสอบ",
    amount: 3000,
    studentYear: 1,
    purpose: "ค่าครองชีพ",
    additionalNote: null,
    bankName: "ธนาคารไทยพาณิชย์",
    bankAccountNo: "1112223333",
    bankAccountName: "สมหญิง ใฝ่ดี",
    installmentCount: 1,
  };

  assert.throws(() => parseLoanInput({ ...base, advisorName: "" }), /advisorName is invalid/);
  assert.throws(() => parseLoanInput({ ...base, purpose: "   " }), /purpose is invalid/);
  assert.throws(() => parseLoanInput({ ...base, bankName: "" }), /bankName is invalid/);
  assert.throws(() => parseLoanInput({ ...base, bankAccountNo: "" }), /bankAccountNo is invalid/);
  assert.throws(() => parseLoanInput({ ...base, bankAccountName: "" }), /bankAccountName is invalid/);
});

test("parsePhoneNumber validates Thai mobile and landline phone formats", () => {
  assert.equal(parsePhoneNumber("0812345678"), "0812345678");
  assert.equal(parsePhoneNumber("0987654321"), "0987654321");
  assert.equal(parsePhoneNumber("0611223344"), "0611223344");
  assert.equal(parsePhoneNumber("021234567"), "021234567");
  assert.equal(parsePhoneNumber("053123456"), "053123456");
  assert.equal(parsePhoneNumber("081-234-5678"), "0812345678");
  assert.equal(parsePhoneNumber("053-123-456"), "053123456");

  assert.throws(() => parsePhoneNumber("0112345678"), /phoneNumber is invalid/);
  assert.throws(() => parsePhoneNumber("081234567"), /phoneNumber is invalid/);
  assert.throws(() => parsePhoneNumber("0212345678"), /phoneNumber is invalid/);
  assert.throws(() => parsePhoneNumber("1812345678"), /phoneNumber is invalid/);
  assert.throws(() => parsePhoneNumber(""), /phoneNumber is invalid/);
});

test("repayment schedule correctly distributes remainder to final installment", () => {
  const loanAmount = 10000;
  const count = 3;
  const baseAmount = Math.floor(loanAmount / count);
  const remainder = loanAmount % count;

  const installments = Array.from({ length: count }, (_, i) => ({
    installmentNumber: i + 1,
    amount: baseAmount + (i === count - 1 ? remainder : 0),
  }));

  assert.equal(installments.length, 3);
  assert.equal(installments[0].amount, 3333);
  assert.equal(installments[1].amount, 3333);
  assert.equal(installments[2].amount, 3334);
  assert.equal(
    installments.reduce((sum, item) => sum + item.amount, 0),
    10000
  );
});
