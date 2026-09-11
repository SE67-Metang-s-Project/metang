import assert from "node:assert/strict";
import { test } from "node:test";
import { canReadDisbursementSlip, canReadRepaymentSlip } from "../lib/slip-access";

const STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_STUDENT_ID = "22222222-2222-2222-2222-222222222222";
const ADMIN_ID = "33333333-3333-3333-3333-333333333333";
const OTHER_ADMIN_ID = "44444444-4444-4444-4444-444444444444";

test("canReadRepaymentSlip: student reads only their own loan's payment slip", () => {
  const payment = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadRepaymentSlip("student", STUDENT_ID, payment), true);
  assert.equal(canReadRepaymentSlip("student", OTHER_STUDENT_ID, payment), false);
});

test("canReadRepaymentSlip: admin/super_admin/executive read any student's repayment slip", () => {
  const payment = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadRepaymentSlip("admin", OTHER_ADMIN_ID, payment), true);
  assert.equal(canReadRepaymentSlip("super_admin", OTHER_ADMIN_ID, payment), true);
  assert.equal(canReadRepaymentSlip("executive", OTHER_ADMIN_ID, payment), true);
});

test("canReadRepaymentSlip: advisor never reads repayment slips", () => {
  const payment = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadRepaymentSlip("advisor", STUDENT_ID, payment), false);
});

test("canReadDisbursementSlip: admin/super_admin/executive read any disbursement slip", () => {
  const fundTransaction = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadDisbursementSlip("admin", OTHER_ADMIN_ID, fundTransaction), true);
  assert.equal(canReadDisbursementSlip("super_admin", OTHER_ADMIN_ID, fundTransaction), true);
  assert.equal(canReadDisbursementSlip("executive", OTHER_ADMIN_ID, fundTransaction), true);
});

test("canReadDisbursementSlip: student reads only their own loan's disbursement slip", () => {
  const fundTransaction = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadDisbursementSlip("student", STUDENT_ID, fundTransaction), true);
  assert.equal(canReadDisbursementSlip("student", OTHER_STUDENT_ID, fundTransaction), false);
});

test("canReadDisbursementSlip: advisor never reads disbursement slips", () => {
  const fundTransaction = { loan: { studentId: STUDENT_ID } };
  assert.equal(canReadDisbursementSlip("advisor", ADMIN_ID, fundTransaction), false);
});
