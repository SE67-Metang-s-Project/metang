import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const recipients = read("db/queries/notification-recipients.ts");
const notifyFn = recipients.slice(recipients.indexOf("export async function notifyLoanReviewer"));
const sendFn = recipients.slice(
  recipients.indexOf("export async function sendReviewerNotifications"),
  recipients.indexOf("export async function notifyLoanReviewer"),
);

test("notifyLoanReviewer re-fetches the loan's current status rather than trusting a passed-in one", () => {
  assert.match(notifyFn, /await getLoanNotificationContext\(loanId\)/);
});

test("notifyLoanReviewer no-ops for a status with no reviewer step", () => {
  assert.match(notifyFn, /const step = REVIEWER_STEP_BY_STATUS\[loan\.status\];/);
  assert.match(notifyFn, /if \(!step\) return;/);
});

test("notifyLoanReviewer never throws - every failure path is caught, not propagated", () => {
  // The whole body must be inside one try/catch, and the catch must not re-throw.
  const tryIndex = notifyFn.indexOf("try {");
  const catchIndex = notifyFn.indexOf("} catch (error) {");
  assert.ok(tryIndex > -1 && catchIndex > tryIndex, "notifyLoanReviewer must wrap its body in try/catch");

  const catchBlock = notifyFn.slice(catchIndex, notifyFn.indexOf("\n}", catchIndex) + 2);
  assert.doesNotMatch(catchBlock, /\bthrow\b/, "the catch block must not re-throw");
  assert.match(catchBlock, /console\.error/);
});

test("notifyLoanReviewer delegates delivery to the shared sendReviewerNotifications helper", () => {
  // Delivery logic (deep link + payload + Promise.allSettled) lives in ONE place, shared with
  // POST /api/notifications/fon, so the two can never drift on message shape or idempotency-key
  // format - see the "shared helper" tests below.
  assert.match(notifyFn, /await sendReviewerNotifications\(step, loan, recipients\)/);
});

test("sendReviewerNotifications scopes each recipient's idempotency key to role, loan, status, and email", () => {
  assert.match(
    sendFn,
    /idempotencyKey:\s*`\$\{step\.role\}:\$\{loan\.id\}:\$\{loan\.status\}:\$\{email\}`/,
  );
});

test("sendReviewerNotifications delivers to all recipients independently via Promise.allSettled", () => {
  // One recipient's failure (e.g. one of several admins) must not block delivery to the others.
  assert.match(sendFn, /Promise\.allSettled\(/);
});

test("POST /api/notifications/fon reuses sendReviewerNotifications instead of its own delivery loop", () => {
  const source = read("app/api/notifications/fon/route.ts");
  assert.match(
    source,
    /import \{[\s\S]*?sendReviewerNotifications[\s\S]*?\} from "@\/db\/queries\/notification-recipients";/,
  );
  assert.match(source, /await sendReviewerNotifications\(step, loan, recipients\)/);
  assert.doesNotMatch(source, /Promise\.allSettled\(/, "delivery loop must not be duplicated here");
});

test("the FON API request has a bounded timeout so a hung provider cannot stall the caller's response indefinitely", () => {
  const source = read("lib/line-notification.ts");
  assert.match(source, /signal:\s*AbortSignal\.timeout\(/);
});

function callSiteAfterMutation(source, mutationCallMarker) {
  const mutationEnd = source.indexOf(mutationCallMarker);
  assert.notEqual(mutationEnd, -1, `missing marker: ${mutationCallMarker}`);
  return source.slice(mutationEnd);
}

test("student loan creation notifies the advisor AFTER the transaction commits, not inside it", () => {
  const source = read("app/api/student/loan-requests/route.ts");
  assert.match(source, /import \{ notifyLoanReviewer \} from "@\/db\/queries\/notification-recipients";/);

  const afterTx = callSiteAfterMutation(source, "const loan = await prisma.$transaction(async (tx) => {");
  const txCloseIndex = afterTx.indexOf("\n    });");
  assert.notEqual(txCloseIndex, -1);
  const insideTx = afterTx.slice(0, txCloseIndex);
  const afterTxClose = afterTx.slice(txCloseIndex);

  assert.doesNotMatch(insideTx, /notifyLoanReviewer/, "must not be called inside the transaction");
  assert.match(afterTxClose, /await notifyLoanReviewer\(loan\.id\);/);
});

test("resubmit notifies the correct reviewer AFTER the transaction commits, not inside it", () => {
  const source = read("app/api/student/loan-requests/[id]/resubmit/route.ts");
  assert.match(source, /import \{ notifyLoanReviewer \} from "@\/db\/queries\/notification-recipients";/);

  const afterTx = callSiteAfterMutation(source, "const loan = await prisma.$transaction(async (tx) => {");
  const txCloseIndex = afterTx.indexOf("\n    });");
  assert.notEqual(txCloseIndex, -1);
  const insideTx = afterTx.slice(0, txCloseIndex);
  const afterTxClose = afterTx.slice(txCloseIndex);

  assert.doesNotMatch(insideTx, /notifyLoanReviewer/, "must not be called inside the transaction");
  assert.match(afterTxClose, /await notifyLoanReviewer\(loan\.id\);/);
});

test("advisor decision notifies Admin AFTER decideLoanRequest resolves", () => {
  const source = read("app/api/advisor/loan-requests/[id]/decision/route.ts");
  assert.match(source, /import \{ notifyLoanReviewer \} from "@\/db\/queries\/notification-recipients";/);

  const afterDecision = callSiteAfterMutation(source, "const loan = await decideLoanRequest({");
  const callCloseIndex = afterDecision.indexOf("});");
  assert.notEqual(callCloseIndex, -1);
  assert.match(afterDecision.slice(callCloseIndex), /await notifyLoanReviewer\(loan\.id\);/);
});

test("admin decision notifies Executive AFTER decideAdminLoanRequest resolves", () => {
  const source = read("app/api/admin/loan-requests/[id]/decision/route.ts");
  assert.match(source, /import \{ notifyLoanReviewer \} from "@\/db\/queries\/notification-recipients";/);

  const afterDecision = callSiteAfterMutation(source, "const loan = await decideAdminLoanRequest({");
  const callCloseIndex = afterDecision.indexOf("});");
  assert.notEqual(callCloseIndex, -1);
  assert.match(afterDecision.slice(callCloseIndex), /await notifyLoanReviewer\(loan\.id\);/);
});

test("db/queries/loan-requests.ts (advisor/admin decision transactions) does not call notifyLoanReviewer itself", () => {
  // notifyLoanReviewer makes network calls and must never run inside a $transaction - keeping it
  // out of loan-requests.ts entirely (called only from the route layer, after the query layer
  // returns) makes that impossible to get wrong by construction.
  const source = read("db/queries/loan-requests.ts");
  assert.doesNotMatch(source, /notifyLoanReviewer/);
});
