import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const review = read("db/queries/payment-review.ts");
const decide = review.slice(review.indexOf("export async function decidePayment"));
const worker = read("app/api/cron/deliver-payment-outcomes/route.ts");
const scheduler = read("lib/jobs/start-scheduler.ts");

test("the decision enqueues the student's outcome inside its own transaction", () => {
  assert.match(decide, /await enqueueNotification\(tx, \{/);
  assert.match(decide, /eventType: PAYMENT_OUTCOME_EVENT/);
  assert.match(decide, /dedupeKey: buildPaymentOutcomeDedupeKey\(paymentId\)/);
  // After the CAS and the audit row, so a stale decision throws before anything is enqueued.
  assert.ok(decide.indexOf("enqueueNotification(tx") > decide.indexOf("tx.payment.updateMany"));
  assert.ok(decide.indexOf("enqueueNotification(tx") > decide.indexOf("tx.auditLog.create"));
});

test("the outcome payload holds ids only - no slip, storage path, or bank data", () => {
  const call = decide.slice(decide.indexOf("enqueueNotification(tx"));
  const payload = call.slice(call.indexOf("payload:"), call.indexOf("});"));
  assert.match(payload, /payload: \{ paymentId, loanId: current\.loanId \}/);
  assert.doesNotMatch(payload, /slip|bank|account|email|note/i);
});

test("the payment-outcome worker claims only its own event and sends by email, never FON", () => {
  assert.match(worker, /claimDueNotifications\(20, PAYMENT_OUTCOME_EVENT\)/);
  assert.match(worker, /checkCronAuth\(request\)/);
  assert.match(worker, /sendEmail\(emailPayload\)/);
  assert.doesNotMatch(worker, /sendLineNotification|line-notification/);
});

test("the payment-outcome worker is scheduled by the backend job scheduler", () => {
  assert.match(scheduler, /path: "\/api\/cron\/deliver-payment-outcomes",\s*shouldRun: everyMinutes\(3\)/);
});
