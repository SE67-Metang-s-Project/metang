import test from "node:test";
import assert from "node:assert/strict";
import { mapStudentApiError, mapNetworkError } from "../lib/student-error-mapper";

test("maps 401 and 403 to UNAUTHORIZED with login action", () => {
  const err401 = mapStudentApiError(401, { error: { code: "UNAUTHORIZED", message: "Authentication required" } });
  assert.equal(err401.code, "UNAUTHORIZED");
  assert.equal(err401.action, "login");
  assert.match(err401.message, /เซสชัน/);

  const err403 = mapStudentApiError(403);
  assert.equal(err403.code, "UNAUTHORIZED");
  assert.equal(err403.action, "login");
});

test("maps 404 to NOT_FOUND with appropriate message", () => {
  const notFound = mapStudentApiError(404, { error: { code: "NOT_FOUND", message: "Loan request not found" } });
  assert.equal(notFound.code, "NOT_FOUND");
  assert.equal(notFound.action, "dashboard");

  const resubmitNotFound = mapStudentApiError(404, null, { isResubmit: true });
  assert.equal(resubmitNotFound.code, "NOT_FOUND");
  assert.match(resubmitNotFound.message, /แก้ไข/);
});

test("maps 409 to CONFLICT differentiating initial and resubmit", () => {
  const conflictInit = mapStudentApiError(409, { error: { code: "CONFLICT", message: "You already have an open loan request" } });
  assert.equal(conflictInit.code, "CONFLICT");
  assert.equal(conflictInit.action, "dashboard");
  assert.match(conflictInit.message, /กำลังดำเนินการอยู่แล้ว/);

  const conflictResubmit = mapStudentApiError(409, { error: { code: "CONFLICT", message: "The request is no longer available for resubmission" } }, { isResubmit: true });
  assert.equal(conflictResubmit.code, "CONFLICT");
  assert.equal(conflictResubmit.action, "refresh");
  assert.match(conflictResubmit.message, /เปลี่ยนแปลง/);
});

test("maps 422 to VALIDATION_ERROR and targets specific fields", () => {
  const advisorErr = mapStudentApiError(422, { error: { code: "VALIDATION_ERROR", message: "advisorName is ambiguous or not found" } });
  assert.equal(advisorErr.code, "VALIDATION_ERROR");
  assert.equal(advisorErr.field, "advisorName");
  assert.match(advisorErr.message, /อาจารย์ที่ปรึกษา/);

  const amountErr = mapStudentApiError(422, { error: { code: "VALIDATION_ERROR", message: "amount is invalid" } });
  assert.equal(amountErr.code, "VALIDATION_ERROR");
  assert.equal(amountErr.field, "loanAmount");

  const bankErr = mapStudentApiError(422, { error: { code: "VALIDATION_ERROR", message: "bankAccountNo is invalid" } });
  assert.equal(bankErr.code, "VALIDATION_ERROR");
  assert.equal(bankErr.field, "accountNumber");

  const phoneErr = mapStudentApiError(422, { error: { code: "VALIDATION_ERROR", message: "phoneNumber is invalid" } });
  assert.equal(phoneErr.code, "VALIDATION_ERROR");
  assert.equal(phoneErr.field, "phoneNumber");
});

test("maps 500+ server errors to INTERNAL_ERROR with retry action", () => {
  const err500 = mapStudentApiError(500);
  assert.equal(err500.code, "INTERNAL_ERROR");
  assert.equal(err500.action, "retry");
  assert.match(err500.message, /เซิร์ฟเวอร์/);
});

test("maps network failures to NETWORK_ERROR", () => {
  const netErr = mapNetworkError(new Error("Failed to fetch"));
  assert.equal(netErr.code, "NETWORK_ERROR");
  assert.equal(netErr.action, "retry");
  assert.match(netErr.message, /เชื่อมต่อ/);
});
