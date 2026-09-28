import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const route = read("app/api/student/loan-requests/[id]/confirm-transfer/route.ts");
const payments = read("db/queries/student-payments.ts");
const paymentsRoute = read("app/api/student/payments/route.ts");

test("confirm-transfer refuses a cross-origin request before touching the session", () => {
  const originCheck = route.indexOf("if (!isSameOrigin(request))");
  const auth = route.indexOf("await getStudentContext()");
  const idCheck = route.indexOf("if (!isLoanId(id))");
  assert.ok(originCheck > -1, "confirm-transfer must call isSameOrigin");
  assert.ok(originCheck < auth, "the origin check must run before authentication");
  assert.ok(auth < idCheck, "the loan id is validated after authentication");
  assert.match(route, /"FORBIDDEN", "A same-origin request is required", 403/);
  assert.match(route, /@add 403:ApiErrorResponse/);
});

test("only the student's own disbursed loan can be confirmed", () => {
  assert.match(route, /where: \{ id, studentId: context\.user\.id \}/);
  assert.match(route, /if \(current\.status !== "disbursed"\) throw new Error\("STALE_CONFIRM"\);/);
  assert.match(route, /"The loan transfer cannot be confirmed in its current status",\s*409/);
});

test("confirming is idempotent and a compare-and-set", () => {
  // An already confirmed loan returns before any write, so a second click writes no audit row.
  const write = route.indexOf("tx.loanRequest.updateMany(");
  assert.ok(route.indexOf("if (current.transferConfirmedAt) return current;") < write);
  assert.match(
    route,
    new RegExp(
      String.raw`updateMany\(\{\s*where: \{\s*id,\s*studentId: context\.user\.id,\s*` +
        String.raw`status: "disbursed",\s*transferConfirmedAt: null,\s*\}`,
    ),
  );
  assert.match(route, /data: \{ transferConfirmedAt: new Date\(\) \}/);
  // A lost race re-reads: confirmed by the winner is still a success.
  assert.match(
    route,
    /if \(updated\.count !== 1\) \{\s*[^}]*if \(final\.transferConfirmedAt\) return final;/,
  );
});

test("the confirmation is audited", () => {
  assert.match(route, /action: "loan_request\.transfer_confirmed"/);
  assert.match(route, /before: serializeJson\(current\)/);
  assert.match(route, /after: serializeJson\(final\)/);
  assert.match(route, /return apiOk\(serializeJson\(loan\)\);/);
});

test("a repayment is refused until the transfer is confirmed", () => {
  assert.match(payments, /select: \{ id: true, status: true, transferConfirmedAt: true \}/);
  assert.match(
    payments,
    /if \(!loan\.transferConfirmedAt\) throw new StudentPaymentError\("TRANSFER_NOT_CONFIRMED"\);/,
  );
  // After the status check, before anything is written.
  const write = payments.slice(payments.indexOf("export async function createStudentPayment"));
  assert.ok(write.indexOf("LOAN_NOT_DISBURSED") < write.indexOf("TRANSFER_NOT_CONFIRMED"));
  assert.ok(write.indexOf("TRANSFER_NOT_CONFIRMED") < write.indexOf("tx.payment.create"));
  assert.match(
    paymentsRoute,
    new RegExp(
      String.raw`error\.code === "TRANSFER_NOT_CONFIRMED"\) \{\s*return apiError\("CONFLICT", ` +
        String.raw`"Confirm receipt of the loan transfer before repaying", 409\);`,
    ),
  );
});

test("the confirmation lives on the server, not in the browser", () => {
  assert.equal(existsSync(resolve(root, "lib/student-transfer-confirmation.ts")), false);

  const dashboard = read("components/student/dashboard/StudentDashboard.tsx");
  const details = read("components/student/loan-details/LoanDetailsPage.tsx");
  const timeline = read("components/student/loan-details/LoanTimeline.tsx");
  for (const source of [dashboard, details, timeline]) {
    assert.doesNotMatch(source, /localStorage|student-transfer-confirm/);
  }
  for (const source of [dashboard, details]) {
    assert.match(source, /\/api\/student\/loan-requests\/\$\{[^}]+\}\/confirm-transfer/);
    assert.match(source, /isTransferConfirmed/);
  }
});

test("the success dialog opens only after the confirmation is saved", () => {
  const timeline = read("components/student/loan-details/LoanTimeline.tsx");
  const handler = timeline.slice(timeline.indexOf("const handleConfirmTransfer"));
  assert.ok(
    handler.indexOf("await onConfirmTransfer()") <
      handler.indexOf("setIsConfirmationSuccessOpen(true)"),
  );
  assert.match(handler, /if \(!onConfirmTransfer \|\| isConfirmingTransfer\.current\) return;/);
  assert.match(
    handler,
    /"ไม่สามารถยืนยันการรับเงินได้ กรุณาลองใหม่อีกครั้ง",\s*"Unable to confirm receipt\. Please try again\."/,
  );
});

test("the migration adds the column, ties it to disbursement, and backfills", () => {
  const migration = read(
    "db/migrations/20260929120000_loan_request_transfer_confirmed/migration.sql",
  );
  assert.match(migration, /ADD COLUMN "transfer_confirmed_at" TIMESTAMPTZ\(6\);/);
  assert.match(
    migration,
    /CHECK \("transfer_confirmed_at" IS NULL OR "disbursed_at" IS NOT NULL\);/,
  );
  assert.match(migration, /SET "transfer_confirmed_at" = l\."disbursed_at"/);
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
  assert.doesNotMatch(migration, /DROP /);
});
