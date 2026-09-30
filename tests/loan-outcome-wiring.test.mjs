import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const service = read("db/queries/loan-requests.ts");
const sliceFunction = (name) => {
  const start = service.indexOf(`export async function ${name}(`);
  const next = service.indexOf("\nexport ", start + 1);
  return service.slice(start, next === -1 ? undefined : next);
};
const recipients = read("db/queries/notification-recipients.ts");
const worker = read("app/api/cron/deliver-loan-outcomes/route.ts");
const scheduler = read("lib/jobs/start-scheduler.ts");

test("no decision, disbursement, or cancel enqueues a student loan-outcome email", () => {
  // Students are emailed only for due-date and overdue reminders (since 2026-10-01).
  assert.doesNotMatch(service, /enqueueStudentLoanOutcome/);
  for (const name of [
    "decideLoanRequest",
    "decideAdminLoanRequest",
    "decideExecutiveLoanRequest",
    "disburseLoanRequest",
    "cancelAdminLoanRequest",
  ]) {
    assert.doesNotMatch(sliceFunction(name), /enqueueStudentLoanOutcome|LOAN_OUTCOME/, name);
  }
});

test("the loan-outcome payload holds ids only", () => {
  const helper = recipients.slice(recipients.indexOf("export function enqueueStudentLoanOutcome"));
  const payload = helper.slice(helper.indexOf("payload:"), helper.indexOf("});"));
  assert.match(payload, /payload: \{ loanId: input\.loanId, outcome: input\.outcome \}/);
  assert.doesNotMatch(payload, /slip|bank|account|email|comment/i);
});

test("the delivery-time read selects no bank field or slip", () => {
  const select = recipients.slice(
    recipients.indexOf("const loanOutcomeSelect"),
    recipients.indexOf("satisfies Prisma.LoanRequestSelect"),
  );
  assert.doesNotMatch(select, /bank|slipPath|fundTransactions/);
});

test("the loan-outcome worker claims only its own event, emails, never uses FON, and is scheduled", () => {
  assert.match(worker, /claimDueNotifications\(20, LOAN_OUTCOME_EVENT\)/);
  assert.match(worker, /checkCronAuth\(request\)/);
  assert.match(worker, /sendEmail\(emailPayload\)/);
  assert.doesNotMatch(worker, /sendLineNotification|line-notification/);
  assert.match(scheduler, /path: "\/api\/cron\/deliver-loan-outcomes",\s*shouldRun: everyMinutes\(3\)/);
});
