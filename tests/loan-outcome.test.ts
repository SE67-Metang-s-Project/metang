import test from "node:test";
import assert from "node:assert/strict";
import {
  LOAN_OUTCOME_EVENT,
  buildLoanOutcomeDedupeKey,
  decideLoanOutcomeDelivery,
  isLoanOutcomePayload,
  parseLoanOutcomeRow,
} from "../lib/notifications/loan-outcome";
import { buildLoanOutcomeEmail } from "../lib/email-api/loan-outcome-template";

// Pure logic only - no DB connection or email API is used.

const common = {
  studentName: "สมชาย ใจดี",
  studentEmail: "somchai_j@cmu.ac.th",
  loanId: "REQ202609280001",
  loanDetailUrl: "https://metang.example/student/detail",
};

test("one dedupe key per loan and outcome", () => {
  assert.equal(buildLoanOutcomeDedupeKey("REQ1", "disbursed"), "loan-outcome:REQ1:disbursed");
  assert.equal(buildLoanOutcomeDedupeKey("REQ1", "rejected"), "loan-outcome:REQ1:rejected");
});

test("the payload guard accepts only a loan id and a known outcome", () => {
  assert.equal(isLoanOutcomePayload({ loanId: "REQ1", outcome: "disbursed" }), true);
  assert.equal(isLoanOutcomePayload({ loanId: "REQ1", outcome: "rejected" }), true);
  assert.equal(isLoanOutcomePayload({ loanId: "REQ1", outcome: "approved" }), false);
  assert.equal(isLoanOutcomePayload({ outcome: "rejected" }), false);
  assert.equal(isLoanOutcomePayload(null), false);
});

test("a row of another event type or a malformed payload fails permanently", () => {
  assert.equal(parseLoanOutcomeRow({ eventType: "payment_outcome", payload: {} }).kind, "fail");
  assert.equal(parseLoanOutcomeRow({ eventType: LOAN_OUTCOME_EVENT, payload: {} }).kind, "fail");
  assert.deepEqual(
    parseLoanOutcomeRow({
      eventType: LOAN_OUTCOME_EVENT,
      payload: { loanId: "REQ1", outcome: "rejected" },
    }),
    { kind: "ok", loanId: "REQ1", outcome: "rejected" },
  );
});

test("the notice is sent only while the loan status still matches the outcome", () => {
  assert.equal(decideLoanOutcomeDelivery(null, "rejected").kind, "skip");
  assert.equal(decideLoanOutcomeDelivery({ status: "rejected" }, "rejected").kind, "send");
  assert.equal(decideLoanOutcomeDelivery({ status: "disbursed" }, "disbursed").kind, "send");
  // Repaid before delivery: the student is still told the money was sent.
  assert.equal(decideLoanOutcomeDelivery({ status: "closed" }, "disbursed").kind, "send");
  assert.equal(decideLoanOutcomeDelivery({ status: "pending_admin" }, "rejected").kind, "skip");
  assert.equal(decideLoanOutcomeDelivery({ status: "rejected" }, "disbursed").kind, "skip");
});

test("the disbursement email states the amount and the first installment", () => {
  const email = buildLoanOutcomeEmail({
    ...common,
    outcome: "disbursed",
    amount: 20000,
    installmentCount: 4,
    firstDueDate: new Date("2026-10-28T00:00:00Z"),
    firstInstallmentAmount: 5000,
  });
  assert.equal(email.sentTo, common.studentEmail);
  assert.match(email.subject, /โอนเงินกู้ยืมเรียบร้อยแล้ว/);
  assert.match(email.message, /20,000 บาท/);
  assert.match(email.message, /ทั้งหมด 4 งวด/);
  assert.match(email.message, /งวดที่ 1 จำนวน 5,000 บาท/);
});

test("the rejection email names the reviewer step and carries the reason", () => {
  const email = buildLoanOutcomeEmail({
    ...common,
    outcome: "rejected",
    rejectedBy: "advisor",
    reason: "เอกสารประกอบไม่ครบ",
  });
  assert.match(email.subject, /ไม่ได้รับการอนุมัติ/);
  assert.match(email.message, /ไม่ได้รับการอนุมัติจากอาจารย์ที่ปรึกษา/);
  assert.match(email.message, /เหตุผล: เอกสารประกอบไม่ครบ/);
});

test("neither email carries slip evidence, a storage path, or bank data", () => {
  const emails = [
    buildLoanOutcomeEmail({
      ...common,
      outcome: "disbursed",
      amount: 1,
      installmentCount: 1,
      firstDueDate: new Date(),
      firstInstallmentAmount: 1,
    }),
    buildLoanOutcomeEmail({ ...common, outcome: "rejected", rejectedBy: null, reason: null }),
  ];
  for (const email of emails) {
    assert.doesNotMatch(email.message, /slip|disbursement\/|storage|บัญชี|ธนาคาร/i);
  }
});
