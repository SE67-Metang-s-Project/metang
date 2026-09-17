import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("notifyLoanReviewer is completely removed from notification-recipients.ts", () => {
  const source = read("db/queries/notification-recipients.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);
});

test("enqueueReviewerNotifications uses the passed transaction to observe its own writes", () => {
  const source = read("db/queries/notification-recipients.ts");
  const enqueueFn = source.slice(
    source.indexOf("export async function enqueueReviewerNotifications"),
  );
  assert.match(enqueueFn, /const loan = await tx\.loanRequest\.findUnique\(/);
  assert.match(
    enqueueFn,
    /const recipients = await resolveReviewerRecipients\(step\.role, loan, tx\);/,
  );
});

test("student loan creation enqueues notifications INSIDE the transaction", () => {
  const source = read("app/api/student/loan-requests/route.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);

  const txStart = source.indexOf("await prisma.$transaction(");
  const txEnd = source.lastIndexOf("});");
  const insideTx = source.slice(txStart, txEnd);

  assert.match(insideTx, /await enqueueReviewerNotifications\(tx,/);
});

test("resubmit enqueues notifications INSIDE the transaction", () => {
  const source = read("app/api/student/loan-requests/[id]/resubmit/route.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);

  const txStart = source.indexOf("await prisma.$transaction(");
  const txEnd = source.lastIndexOf("});");
  const insideTx = source.slice(txStart, txEnd);

  assert.match(insideTx, /await enqueueReviewerNotifications\(tx,/);
});

test("loan-requests.ts enqueues notifications INSIDE transactions for its four sites", () => {
  const source = read("db/queries/loan-requests.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);

  // The word enqueueReviewerNotifications should appear at least 4 times.
  const matches = [...source.matchAll(/await enqueueReviewerNotifications\(tx,/g)];
  assert.ok(matches.length >= 4, "Should have at least 4 calls to enqueueReviewerNotifications");
});

test("advisor decision route no longer sends notifications inline", () => {
  const source = read("app/api/advisor/loan-requests/[id]/decision/route.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);
  assert.doesNotMatch(source, /enqueueReviewerNotifications/); // Handled by query layer
});

test("admin decision route no longer sends notifications inline", () => {
  const source = read("app/api/admin/loan-requests/[id]/decision/route.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);
  assert.doesNotMatch(source, /enqueueReviewerNotifications/); // Handled by query layer
});

test("deliver-fon cron worker passes REVIEWER_NOTIFICATION_EVENT to claimDueNotifications", () => {
  const source = read("app/api/cron/deliver-fon/route.ts");
  assert.match(source, /claimDueNotifications\([^,]+,\s*REVIEWER_NOTIFICATION_EVENT\)/);
});

test("deliver-reminders worker passes INSTALLMENT_REMINDER_EVENT to claimDueNotifications", () => {
  const source = read("app/api/cron/deliver-reminders/route.ts");
  assert.match(source, /claimDueNotifications\([^,]+,\s*INSTALLMENT_REMINDER_EVENT\)/);
});
