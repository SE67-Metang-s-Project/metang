import test from "node:test";
import assert from "node:assert/strict";
import { parseReminderRow, decideDelivery } from "../lib/notifications/delivery-decision";
import { INSTALLMENT_REMINDER_EVENT } from "../lib/notifications/installment-reminder";

test("parseReminderRow handles all branches", () => {
  // wrong eventType
  assert.deepEqual(parseReminderRow({ eventType: "wrong", payload: {} }), {
    kind: "fail",
    message: "unsupported eventType: wrong",
  });

  // malformed payload
  assert.deepEqual(
    parseReminderRow({ eventType: INSTALLMENT_REMINDER_EVENT, payload: { loanId: "L1" } }),
    { kind: "fail", message: "malformed payload" }
  );

  // NON-NUMERIC installmentId
  assert.deepEqual(
    parseReminderRow({
      eventType: INSTALLMENT_REMINDER_EVENT,
      payload: { loanId: "L1", installmentId: "I1" },
    }),
    { kind: "fail", message: "malformed payload" }
  );

  // valid numeric payload
  assert.deepEqual(
    parseReminderRow({
      eventType: INSTALLMENT_REMINDER_EVENT,
      payload: { loanId: "L1", installmentId: "123" },
    }),
    { kind: "ok", installmentId: BigInt(123) }
  );
});

test("decideDelivery handles all branches", () => {
  // null installment
  assert.deepEqual(decideDelivery(null), { kind: "skip", reason: "installment no longer exists" });

  // settledAt set
  assert.deepEqual(
    decideDelivery({ settledAt: new Date(), amountDue: 100, amountPaid: 0, loan: { status: "disbursed" } }),
    { kind: "skip", reason: "installment already settled" }
  );

  // loan.status not disbursed (using real LoanStatus enum values)
  for (const status of ["cancelled", "rejected", "closed", "pending_disbursement"]) {
    assert.deepEqual(
      decideDelivery({ settledAt: null, amountDue: 100, amountPaid: 0, loan: { status } }),
      { kind: "skip", reason: `loan is not disbursed (status: ${status})` }
    );
  }

  // amountPaid === amountDue
  assert.deepEqual(
    decideDelivery({ settledAt: null, amountDue: 100, amountPaid: 100, loan: { status: "disbursed" } }),
    { kind: "skip", reason: "installment has no remaining balance" }
  );

  // amountPaid > amountDue
  assert.deepEqual(
    decideDelivery({ settledAt: null, amountDue: 100, amountPaid: 150, loan: { status: "disbursed" } }),
    { kind: "skip", reason: "installment has no remaining balance" }
  );

  // happy path - the send variant carries the installment back for the caller to narrow on
  const due = { settledAt: null, amountDue: 100, amountPaid: 25, loan: { status: "disbursed" } };
  assert.deepEqual(decideDelivery(due), { kind: "send", amountRemaining: 75, installment: due });
});
