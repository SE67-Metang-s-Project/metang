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

test("the payment decision enqueues no student email", () => {
  // Students are emailed only for due-date and overdue reminders (since 2026-10-01).
  assert.doesNotMatch(decide, /enqueueNotification|PAYMENT_OUTCOME_EVENT|buildPaymentOutcomeDedupeKey/);
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
