import test from "node:test";
import assert from "node:assert/strict";
import {
  computePaymentBehavior,
  formatThaiDateTime,
  mapToInstallmentPayments,
  mapToLoanDetails,
  mapToPaymentAccount,
  type RawInstallment,
  type RawPayment,
  type RawStudentLoan,
} from "../lib/student-view-model";

const installments: RawInstallment[] = [
  { id: "11", seq: 1, dueDate: "2026-08-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-08-05T03:00:00Z" },
  { id: "12", seq: 2, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 0, settledAt: null },
  { id: "13", seq: 3, dueDate: "2026-10-01", amountDue: 1000, amountPaid: 0, settledAt: null },
];

const now = new Date("2026-09-10T00:00:00Z");

function loanWith(payments: RawPayment[]): RawStudentLoan {
  return {
    id: "L-1",
    amount: 3000,
    purpose: "tuition",
    installmentCount: 3,
    firstDueDate: "2026-08-01",
    status: "disbursed",
    installments,
    payments,
  };
}

test("installments carry overdue and paid-late flags", () => {
  const [first, second, third] = mapToInstallmentPayments(installments, [], now);

  assert.equal(first.status, "paid");
  assert.equal(first.isPaidLate, true);
  assert.equal(second.status, "current");
  assert.equal(second.isOverdue, true);
  assert.equal(third.status, "upcoming");
  assert.equal(third.isOverdue, false);
  assert.equal(second.isAwaitingReview, false);
});

test("a pending review locks the current installment only", () => {
  const payments: RawPayment[] = [
    { id: "p1", installmentId: "12", amount: 1000, status: "pending_review", createdAt: "2026-09-02T00:00:00Z" },
  ];
  const [first, second, third] = mapToInstallmentPayments(installments, payments, now);

  assert.equal(first.isAwaitingReview, false);
  assert.equal(second.isAwaitingReview, true);
  // Upcoming installments keep "pay the previous installment first".
  assert.equal(third.isAwaitingReview, false);
});

test("overdue flips on the Bangkok day after the due date", () => {
  const due = [{ id: "21", seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 0 }];

  const [onDueDay] = mapToInstallmentPayments(due, [], new Date("2026-09-01T09:00:00+07:00"));
  const [dayAfter] = mapToInstallmentPayments(due, [], new Date("2026-09-02T00:30:00+07:00"));

  assert.equal(onDueDay.isOverdue, false);
  assert.equal(dayAfter.isOverdue, true);
});

test("a transfer made on time but confirmed after the due date is not paid late", () => {
  const settled: RawInstallment[] = [
    { id: "31", seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-09-05T03:00:00Z" },
  ];
  const payments: RawPayment[] = [
    { id: "p1", amount: 1000, status: "confirmed", paidAt: "2026-09-01T22:00:00+07:00", confirmedAt: "2026-09-05T03:00:00Z", createdAt: "2026-09-01T15:05:00Z" },
  ];

  const [card] = mapToInstallmentPayments(settled, payments, now);
  assert.equal(card.isPaidLate, false);
  assert.equal(computePaymentBehavior([{ ...loanWith(payments), installments: settled }]).lateInstallments, 0);
});

test("the latest rejection's note shows on the current installment only", () => {
  const payments: RawPayment[] = [
    // Newest first, as the student loan read returns them.
    { id: "p2", installmentId: "12", amount: 1000, status: "rejected", reviewNote: "blurry slip", createdAt: "2026-09-03T00:00:00Z" },
    { id: "p1", installmentId: "11", amount: 1000, status: "confirmed", createdAt: "2026-08-02T00:00:00Z" },
  ];
  const [first, second, third] = mapToInstallmentPayments(installments, payments, now);

  assert.equal(second.paymentNote, "หลักฐานการชำระไม่ผ่านการตรวจสอบ: blurry slip");
  assert.equal(first.paymentNote, undefined);
  assert.equal(third.paymentNote, undefined);
  assert.equal(second.isAwaitingReview, false);
});

test("payment history is oldest first with installment numbers, slip URLs and review states", () => {
  const { paymentHistory } = mapToLoanDetails(
    loanWith([
      { id: "p3", installmentId: "12", amount: 1000, hasSlip: true, status: "pending_review", createdAt: "2026-09-04T00:00:00Z" },
      { id: "p2", installmentId: "12", amount: 1000, hasSlip: true, status: "rejected", reviewNote: "wrong amount", createdAt: "2026-09-03T00:00:00Z" },
      { id: "p1", installmentId: 11, amount: 1000, hasSlip: false, status: "confirmed", createdAt: "2026-08-02T00:00:00Z" },
    ]),
  );

  assert.deepEqual(
    paymentHistory.map((item) => [item.installmentNumber, item.status, item.receiptImage, item.reviewNote]),
    [
      [1, "verified", "", undefined],
      [2, "failed", "/api/payments/p2/slip", "wrong amount"],
      [2, "checking", "/api/payments/p3/slip", undefined],
    ],
  );
  assert.equal(paymentHistory[1].statusLabel, "ไม่ผ่านการตรวจสอบ");
});

test("a resubmitted slip with the same transfer time keeps a distinct id", () => {
  const paidAt = "2026-09-03T02:30:00Z";
  const { paymentHistory } = mapToLoanDetails(
    loanWith([
      { id: "p2", installmentId: "12", amount: 1000, status: "pending_review", paidAt, createdAt: "2026-09-04T00:00:00Z" },
      { id: "p1", installmentId: "12", amount: 1000, status: "rejected", paidAt, createdAt: "2026-09-03T03:00:00Z" },
    ]),
  );

  assert.equal(paymentHistory[0].paidAt, paymentHistory[1].paidAt);
  assert.deepEqual(
    paymentHistory.map((item) => item.id),
    ["p1", "p2"],
  );
});

test("the payment account comes from system settings, without a QR", () => {
  assert.equal(mapToPaymentAccount(null), null);

  const account = mapToPaymentAccount({ bankName: "KTB", accountName: "Fund", accountNumber: "123" });
  assert.equal(account?.accountNumber, "123");
  assert.equal(account?.qrImageSrc, undefined);
});

test("dates and times render in Bangkok whatever the runtime time zone", () => {
  // 17:30 UTC is 00:30 the next day in Bangkok.
  assert.equal(formatThaiDateTime("2026-09-01T17:30:00Z"), "2 ก.ย. 2569 00:30 น.");
  assert.equal(formatThaiDateTime("2026-09-01"), "1 ก.ย. 2569 07:00 น.");
});
