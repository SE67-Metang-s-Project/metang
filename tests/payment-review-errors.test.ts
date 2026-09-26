import test from "node:test";
import assert from "node:assert/strict";
import { paymentDecisionErrorMessage } from "../lib/payment-review-errors";

test("maps each 409 from the decision route to its own Thai message", () => {
  const conflicts = [
    "The payment was already reviewed",
    "The request changed; please retry",
    "The loan is not open for repayment",
    "The payment was already credited to the fund",
  ].map((message) => paymentDecisionErrorMessage(409, message));

  assert.equal(conflicts[0], "สลิปนี้ได้รับการตรวจสอบไปแล้ว");
  assert.match(conflicts[1], /กรุณาลองใหม่/);
  assert.match(conflicts[2], /ไม่อยู่ในสถานะที่รับชำระเงินได้/);
  assert.match(conflicts[3], /บันทึกเข้ากองทุนแล้ว/);
  assert.equal(new Set(conflicts).size, 4, "each conflict reads differently");
});

test("an unknown or missing 409 message falls back to a generic conflict", () => {
  const fallback = "สลิปนี้ได้รับการตรวจสอบไปแล้ว หรือเกิดข้อขัดแย้ง";
  assert.equal(paymentDecisionErrorMessage(409, "Something else"), fallback);
  assert.equal(paymentDecisionErrorMessage(409, undefined), fallback);
  // Never a prototype key looked up by accident.
  assert.equal(paymentDecisionErrorMessage(409, "constructor"), fallback);
});

test("maps validation, auth, and not-found responses", () => {
  assert.equal(
    paymentDecisionErrorMessage(422, "A note is required when rejecting a payment"),
    "กรุณาระบุเหตุผลที่ปฏิเสธสลิป",
  );
  assert.match(paymentDecisionErrorMessage(422, "note is invalid"), /500/);
  assert.equal(paymentDecisionErrorMessage(422, "decision is invalid"), "ข้อมูลที่ส่งไม่ถูกต้อง");
  assert.match(paymentDecisionErrorMessage(401), /เข้าสู่ระบบใหม่/);
  assert.match(paymentDecisionErrorMessage(403), /ไม่มีสิทธิ์/);
  assert.match(paymentDecisionErrorMessage(404), /ไม่พบรายการชำระเงิน/);
});

test("anything else gets a generic Thai error, never the English API text", () => {
  const message = paymentDecisionErrorMessage(500, "Unable to decide payment");
  assert.equal(message, "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบสลิป");
});

test("a same-origin 403 is not reported as a missing role", () => {
  const message = paymentDecisionErrorMessage(403, "A same-origin JSON request is required");
  assert.doesNotMatch(message, /ไม่มีสิทธิ์/);
  assert.match(message, /รีเฟรชหน้า/);
});
