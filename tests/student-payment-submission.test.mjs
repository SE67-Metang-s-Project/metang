import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const query = read("db/queries/student-payments.ts");
const route = read("app/api/student/payments/route.ts");
const disburseRoute = read("app/api/admin/loan-requests/[id]/disburse/route.ts");

test("the loan is resolved server-side, so submitting takes one request", () => {
  // one_open_loan_per_student allows a single non-terminal loan, so there is never more than one
  // disbursed loan to choose between - the client should not have to fetch its id first.
  assert.match(query, /export async function findRepayableLoanId\(studentId: string\)/);
  assert.match(query, /where: \{ studentId, status: "disbursed" \}/);
  assert.match(route, /const loanId = await findRepayableLoanId\(context\.user\.id\);/);
  assert.match(route, /"You have no loan open for repayment", 409/);
  // No loan id in the path, so nothing to validate and nothing for a caller to get wrong.
  assert.doesNotMatch(route, /isLoanId/);
  assert.doesNotMatch(route, /params/);
});

test("the student can only ever submit against their own disbursed loan", () => {
  assert.match(query, /where: \{ id: loanId, studentId \}/);
  assert.match(query, /if \(!loan\) throw new StudentPaymentError\("LOAN_NOT_FOUND"\);/);
  assert.match(
    query,
    /if \(loan\.status !== "disbursed"\) throw new StudentPaymentError\("LOAN_NOT_DISBURSED"\);/,
  );
  assert.match(route, /const context = await getStudentContext\(\);/);
  assert.match(route, /studentId: context\.user\.id/);
});

test("only one submission may await review per loan", () => {
  // Two pending slips for one transfer could both be confirmed, crediting the fund twice.
  assert.match(query, /where: \{ loanId, status: "pending_review" \}/);
  assert.match(query, /if \(alreadyUnderReview\) throw new StudentPaymentError\("REVIEW_IN_PROGRESS"\);/);
  // Serializable, or two concurrent submissions both see no pending row and both insert.
  assert.match(
    query,
    /\{ isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable, timeout: 15000 \}/,
  );
  assert.match(route, /"A payment is already awaiting review", 409/);
});

test("the slip is uploaded privately before the row exists, under the repayment prefix", () => {
  assert.match(route, /buildSlipPath\(\{ kind: "repayment", loanId, ext \}\)/);
  assert.match(route, /await uploadSlip\(\{ path: slipPath, contentType: slip\.type, bytes \}\)/);

  // Same ordering as the disbursement upload: storage first, then the DB write.
  assert.ok(route.indexOf("await uploadSlip(") < route.indexOf("createStudentPayment("));
  assert.ok(disburseRoute.indexOf("await uploadSlip(") < disburseRoute.indexOf("disburseLoanRequest("));
});

test("the file is validated for type and size before anything is stored", () => {
  assert.match(route, /if \(!\(slip instanceof File\) \|\| slip\.size === 0\)/);
  assert.match(route, /const ext = extensionForSlipContentType\(slip\.type\);/);
  assert.match(route, /if \(slip\.size > MAX_SLIP_BYTES\)/);
  assert.ok(route.indexOf("MAX_SLIP_BYTES") < route.indexOf("await uploadSlip("));
});

test("multipart means same-origin is checked directly, not validateJsonRequest", () => {
  // validateJsonRequest demands application/json, which a file upload never sends.
  assert.match(route, /if \(!isSameOrigin\(request\)\)/);
  // The call, not the word - the route comments explain why the helper is skipped.
  assert.doesNotMatch(route, /validateJsonRequest\(request\)/);
  assert.match(disburseRoute, /if \(!isSameOrigin\(request\)\)/);
});

test("no storage path reaches the student, only a flag", () => {
  assert.match(query, /withSlipFlag\(payment\)/);
  assert.doesNotMatch(route, /slipPath: payment/);
  assert.doesNotMatch(query, /slipRef/);
});

test("the recorded installment is context only - allocation still runs oldest-first", () => {
  assert.match(query, /where: \{ loanId, settledAt: null \}/);
  assert.match(query, /orderBy: \{ seq: "asc" \}/);
  assert.match(query, /const unsettled = await tx\.installment\.findMany\(/);
  assert.match(query, /const nextDue = unsettled\[0\];/);
  assert.match(query, /if \(!nextDue\) throw new StudentPaymentError\("NOTHING_OUTSTANDING"\);/);
});

test("a submission cannot exceed what is still owed", () => {
  // The same allocator that applies the money on confirmation, so the two rules cannot drift: a
  // slip accepted here is never one decidePayment refuses as OVERPAYMENT_REQUIRES_CONTACT.
  assert.match(query, /import \{ allocatePayment \} from "@\/lib\/loan-validation";/);
  assert.match(query, /const \{ surplus \} = allocatePayment\(unsettled, amount\);/);
  assert.match(
    query,
    /if \(surplus > 0\) throw new StudentPaymentError\("AMOUNT_EXCEEDS_REMAINING", amount - surplus\);/,
  );
  // Checked inside the Serializable transaction, after the one-open-review guard: with no other
  // slip pending, nothing can shrink the balance between this read and the insert.
  const write = query.slice(query.indexOf("export async function createStudentPayment"));
  assert.ok(write.indexOf("REVIEW_IN_PROGRESS") < write.indexOf("AMOUNT_EXCEEDS_REMAINING"));
  assert.ok(write.indexOf("AMOUNT_EXCEEDS_REMAINING") < write.indexOf("tx.payment.create"));

  assert.match(
    route,
    /error\.code === "AMOUNT_EXCEEDS_REMAINING"\) \{\s*return apiError\(\s*"VALIDATION_ERROR",\s*`amount exceeds the remaining repayment \(\$\{error\.remaining\}\)`,\s*422,/,
  );
});

test("submission is audited and every write goes through tx", () => {
  // Scoped to the write: findRepayableLoanId above it is a deliberate read on the singleton,
  // outside any transaction, because the slip path must be known before the upload.
  const write = query.slice(query.indexOf("export async function createStudentPayment"));
  assert.match(write, /action: "payment\.submitted"/);
  assert.match(write, /tx\.payment\.create/);
  assert.match(write, /tx\.auditLog\.create/);
  assert.doesNotMatch(write, /[^x]\bprisma\.(payment|installment|auditLog|loanRequest)\./);
});

test("the student sees why a payment was rejected", () => {
  // History is served by the existing student loan endpoints, so the reason belongs on that select.
  const loanQueries = read("db/queries/loan-requests.ts");
  const studentPayments = loanQueries.slice(
    loanQueries.indexOf("export const studentLoanDetailSelect"),
    loanQueries.indexOf("export async function getStudentLoanList"),
  );
  assert.match(studentPayments, /reviewNote: true/);
});

test("the contract declares a multipart body with an optional paidAt", () => {
  const spec = JSON.parse(read("public/openapi.json"));
  const operation = spec.paths["/student/payments"].post;
  assert.deepEqual(operation.parameters ?? [], [], "no path parameters to get wrong");
  const body = operation.requestBody.content["multipart/form-data"];
  assert.ok(body, "a file upload cannot be documented as application/json");
  assert.equal(body.schema.properties.slip.format, "binary");
  assert.deepEqual(body.schema.required, ["slip", "amount"]);
});
