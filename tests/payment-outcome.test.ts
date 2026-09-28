import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_OUTCOME_EVENT,
  buildPaymentOutcomeDedupeKey,
  decidePaymentOutcomeDelivery,
  isPaymentOutcomePayload,
  parsePaymentOutcomeRow,
} from "../lib/notifications/payment-outcome";
import { buildPaymentOutcomeEmail } from "../lib/email-api/payment-outcome-template";

// Pure logic only - no DB connection or email API is used.

const baseEmail = {
  studentName: "สมชาย ใจดี",
  studentEmail: "somchai_j@cmu.ac.th",
  amount: 1500,
  loanId: "REQ202609280001",
  loanDetailUrl: "https://metang.example/student/detail",
};

test("one dedupe key per payment, so a retry never enqueues a second outcome", () => {
  assert.equal(
    buildPaymentOutcomeDedupeKey("6f1c2a52-0000-4000-8000-000000000001"),
    "payment-outcome:6f1c2a52-0000-4000-8000-000000000001",
  );
});

test("the payload guard accepts ids only", () => {
  assert.equal(isPaymentOutcomePayload({ paymentId: "p", loanId: "l" }), true);
  assert.equal(isPaymentOutcomePayload({ paymentId: "p" }), false);
  assert.equal(isPaymentOutcomePayload({ paymentId: 1, loanId: "l" }), false);
  assert.equal(isPaymentOutcomePayload(null), false);
});

test("a row of another event type or a malformed payload fails permanently", () => {
  assert.deepEqual(parsePaymentOutcomeRow({ eventType: "installment_reminder", payload: {} }), {
    kind: "fail",
    message: "unsupported eventType: installment_reminder",
  });
  assert.deepEqual(parsePaymentOutcomeRow({ eventType: PAYMENT_OUTCOME_EVENT, payload: {} }), {
    kind: "fail",
    message: "malformed payload",
  });
  assert.deepEqual(
    parsePaymentOutcomeRow({
      eventType: PAYMENT_OUTCOME_EVENT,
      payload: { paymentId: "p1", loanId: "l1" },
    }),
    { kind: "ok", paymentId: "p1" },
  );
});

test("only a decided payment is sent; a missing or undecided one is skipped", () => {
  assert.equal(decidePaymentOutcomeDelivery(null).kind, "skip");
  assert.equal(decidePaymentOutcomeDelivery({ status: "pending_review" }).kind, "skip");

  const confirmed = decidePaymentOutcomeDelivery({ status: "confirmed" });
  assert.equal(confirmed.kind === "send" && confirmed.outcome, "confirmed");
  const rejected = decidePaymentOutcomeDelivery({ status: "rejected" });
  assert.equal(rejected.kind === "send" && rejected.outcome, "rejected");
});

test("the rejection email carries the reviewer reason and asks for a new slip", () => {
  const email = buildPaymentOutcomeEmail({
    ...baseEmail,
    outcome: "rejected",
    reviewNote: "ยอดเงินในสลิปไม่ตรงกับที่แจ้ง",
  });
  assert.equal(email.sentTo, baseEmail.studentEmail);
  assert.match(email.subject, /ไม่ผ่านการตรวจสอบ/);
  assert.match(email.message, /เหตุผล: ยอดเงินในสลิปไม่ตรงกับที่แจ้ง/);
  assert.match(email.message, /ส่งหลักฐานการชำระเงินใหม่ก่อนวันครบกำหนดชำระ/);
});

test("the confirmation email states the amount and carries no reviewer reason", () => {
  const email = buildPaymentOutcomeEmail({ ...baseEmail, outcome: "confirmed", reviewNote: null });
  assert.match(email.subject, /ยืนยันการชำระเงินกู้ยืม/);
  assert.match(email.message, /1,500 บาท/);
  assert.doesNotMatch(email.message, /เหตุผล/);
});

test("neither email carries slip evidence, a storage path, or bank data", () => {
  for (const outcome of ["confirmed", "rejected"] as const) {
    const email = buildPaymentOutcomeEmail({ ...baseEmail, outcome, reviewNote: "note" });
    assert.doesNotMatch(email.message, /slip|repayment\/|storage|บัญชี|ธนาคาร/i);
  }
});

test("a non-CMU address is refused before sending", () => {
  assert.throws(
    () =>
      buildPaymentOutcomeEmail({
        ...baseEmail,
        studentEmail: "someone@example.com",
        outcome: "confirmed",
        reviewNote: null,
      }),
    /studentEmail must be a valid @cmu\.ac\.th address/,
  );
});
