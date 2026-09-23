import test from "node:test";
import assert from "node:assert/strict";
import { deriveInstallmentConduct, type ConductPayment } from "../lib/repayment-conduct";

const now = new Date("2026-09-10T12:00:00+07:00");

function confirmed(amount: number, paidAt: string, confirmedAt: string): ConductPayment {
  return { status: "confirmed", amount, paidAt, confirmedAt, createdAt: paidAt };
}

test("an on-time transfer confirmed after the due date counts on time", () => {
  const conduct = deriveInstallmentConduct(
    [{ seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-09-05T03:00:00Z" }],
    [confirmed(1000, "2026-08-31T10:00:00+07:00", "2026-09-05T03:00:00Z")],
    now,
  );
  assert.deepEqual(conduct, ["on_time"]);
});

test("the due date is inclusive on the Bangkok calendar day", () => {
  const installments = [{ seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000 }];

  // 23:30 Bangkok on the due day is 16:30 UTC: still on time.
  assert.deepEqual(
    deriveInstallmentConduct(installments, [confirmed(1000, "2026-09-01T16:30:00Z", "2026-09-02T02:00:00Z")], now),
    ["on_time"],
  );
  // 00:30 Bangkok the next day is still Sept 1 in UTC: late.
  assert.deepEqual(
    deriveInstallmentConduct(installments, [confirmed(1000, "2026-09-01T17:30:00Z", "2026-09-02T02:00:00Z")], now),
    ["late"],
  );
});

test("a late transfer counts late", () => {
  const conduct = deriveInstallmentConduct(
    [{ seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-09-04T03:00:00Z" }],
    [confirmed(1000, "2026-09-03T10:00:00+07:00", "2026-09-04T03:00:00Z")],
    now,
  );
  assert.deepEqual(conduct, ["late"]);
});

test("one overpayment settles two installments on time", () => {
  const conduct = deriveInstallmentConduct(
    [
      { seq: 1, dueDate: "2026-08-01", amountDue: 1000, amountPaid: 1000 },
      { seq: 2, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000 },
    ],
    [confirmed(2000, "2026-07-30T10:00:00+07:00", "2026-08-05T03:00:00Z")],
    now,
  );
  assert.deepEqual(conduct, ["on_time", "on_time"]);
});

test("the replay follows allocatePayment: oldest, then last, then the rest", () => {
  const conduct = deriveInstallmentConduct(
    [
      { seq: 1, dueDate: "2026-08-01", amountDue: 1000, amountPaid: 1000 },
      { seq: 2, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 0 },
      { seq: 3, dueDate: "2026-10-01", amountDue: 1000, amountPaid: 1000 },
    ],
    [confirmed(2000, "2026-07-30T10:00:00+07:00", "2026-08-05T03:00:00Z")],
    now,
  );
  // The overpayment filled installment 3, so installment 2 is the one left unpaid past due.
  assert.deepEqual(conduct, ["on_time", "late", "on_time"]);
});

test("unsettled installments count late only once past due, and unconfirmed payments count for nothing", () => {
  const conduct = deriveInstallmentConduct(
    [
      { seq: 1, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 0 },
      { seq: 2, dueDate: "2026-10-01", amountDue: 1000, amountPaid: 0 },
    ],
    [
      { status: "pending_review", amount: 1000, paidAt: "2026-08-30T10:00:00+07:00" },
      { status: "rejected", amount: 1000, paidAt: "2026-08-29T10:00:00+07:00" },
    ],
    now,
  );
  assert.deepEqual(conduct, ["late", null]);
});

test("a settled installment with no payment rows falls back to settledAt", () => {
  const conduct = deriveInstallmentConduct(
    [
      { seq: 1, dueDate: "2026-08-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-07-28" },
      { seq: 2, dueDate: "2026-09-01", amountDue: 1000, amountPaid: 1000, settledAt: "2026-09-05" },
    ],
    [],
    now,
  );
  assert.deepEqual(conduct, ["on_time", "late"]);
});
