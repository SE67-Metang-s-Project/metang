import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const review = read("db/queries/payment-review.ts");
const decide = review.slice(review.indexOf("export async function decidePayment"));
const decisionRoute = read("app/api/admin/payments/[id]/decision/route.ts");
const queueRoute = read("app/api/admin/payments/route.ts");
const detailRoute = read("app/api/admin/payments/[id]/route.ts");

test("the decision runs in one Serializable transaction and every write uses tx", () => {
  assert.match(review, /prisma\.\$transaction\(/);
  assert.match(
    review,
    /\{ isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable, timeout: 15000 \}/,
  );

  for (const call of [
    "tx.userRole.findFirst",
    "tx.payment.findUnique",
    "tx.payment.updateMany",
    "tx.payment.findUniqueOrThrow",
    "tx.auditLog.create",
  ]) {
    assert.match(decide, new RegExp(call.replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(decide, /[^x]\bprisma\.(payment|auditLog|userRole|loanRequest)\./);
});

test("an already-reviewed payment conflicts rather than reporting itself missing", () => {
  // Filtering the read on pending_review would 404 a payment that plainly exists. Caught by
  // Workflow step 15 at runtime before this assertion existed.
  assert.match(decide, /tx\.payment\.findUnique\(\{\s*where: \{ id: paymentId \}/);
  assert.match(
    decide,
    /if \(current\.status !== "pending_review"\) throw new PaymentDecisionError\("STALE_DECISION"\);/,
  );
});

test("confirm-once: the status CAS is the guard, and it runs before the money moves", () => {
  assert.match(
    decide,
    /tx\.payment\.updateMany\(\{\s*where: \{ id: paymentId, status: "pending_review" \}/,
  );
  assert.match(decide, /if \(changed\.count !== 1\) throw new PaymentDecisionError\("STALE_DECISION"\);/);

  // applyConfirmedPayment reads the row back as "confirmed", so calling it before the CAS would
  // find nothing. Order is load-bearing, not stylistic.
  const cas = decide.indexOf("changed.count !== 1");
  const apply = decide.indexOf("applyConfirmedPayment(tx");
  assert.ok(cas > -1 && apply > -1 && cas < apply, "the CAS must precede applyConfirmedPayment");
  assert.match(decide, /if \(decision === "confirmed"\) \{\s*await applyConfirmedPayment\(tx, \{ paymentId, actorId: adminId \}\)/);
});

test("the reviewer is recorded for a rejection too, with the reason", () => {
  assert.match(
    decide,
    /data: \{\s*status: decision,\s*confirmedBy: adminId,\s*confirmedAt: new Date\(\),\s*reviewNote: note,/,
  );
});

test("the actor's role is re-checked inside the transaction", () => {
  assert.match(
    decide,
    /tx\.userRole\.findFirst\(\{\s*where: \{ userId: adminId, role: \{ in: \["admin", "super_admin"\] \} \}/,
  );
  assert.match(decide, /if \(!effectiveRole\) throw new PaymentDecisionError\("ACCESS_REVOKED"\);/);
});

test("the decision audit row is distinct from the money-applied row", () => {
  assert.match(decide, /action: `payment\.\$\{decision\}`/);
  assert.match(decide, /entityType: "payment"/);
  // db/queries/payments.ts records the application separately, so a confirm leaves both.
  assert.match(read("db/queries/payments.ts"), /action: "payment\.applied"/);
});

test("no slip storage path is ever selected into a response", () => {
  // Session 2's rule: the reviewer opens the slip through GET /api/payments/{id}/slip.
  assert.match(review, /slipPath: true/, "selected only to derive the flag");
  assert.match(review, /withSlipFlag/);
  assert.doesNotMatch(review, /slipRef/);
  for (const route of [queueRoute, detailRoute, decisionRoute]) {
    assert.doesNotMatch(route, /slipPath|slipRef/);
  }
});

test("every route authorizes before touching data, and hides bad ids as 404", () => {
  for (const route of [queueRoute, detailRoute, decisionRoute]) {
    assert.match(route, /const access = await getAdminAccess\(\);/);
    assert.match(route, /return apiError\("UNAUTHORIZED", "Authentication required", 401\);/);
    assert.match(route, /return apiError\("FORBIDDEN", "Admin access required", 403\);/);
  }
  // A malformed id is 422 and says which id is wanted - the caller is already an authorized admin
  // who can list every payment, so naming the shape leaks nothing and saves a round trip.
  for (const route of [detailRoute, decisionRoute]) {
    assert.match(route, /"id must be a payment uuid, not an installment id", 422/);
    assert.doesNotMatch(route, /isUuid\(id\)\) return apiError\("NOT_FOUND"/);
  }
  // A genuinely absent payment is still 404, not 422.
  assert.match(detailRoute, /if \(!payment\) return apiError\("NOT_FOUND", "Payment not found", 404\);/);
});

test("the mutation validates the request, the body, then maps every domain error", () => {
  assert.match(decisionRoute, /const requestError = validateJsonRequest\(request\);/);
  assert.match(decisionRoute, /parsePaymentDecisionInput\(await request\.json\(\)\)/);
  assert.match(decisionRoute, /"VALIDATION_ERROR",[\s\S]{0,120}422/);

  // The amount is never taken from the body - decidePayment is handed no amount at all, so the
  // stored submission is the only source. (The word "amount" appears in the route's docs.)
  assert.match(
    decisionRoute,
    /decidePayment\(\{\s*paymentId: id,\s*adminId: access\.context\.user\.id,\s*decision: input\.decision,\s*note: input\.note,\s*\}\)/,
  );

  for (const code of ["NOT_FOUND", "STALE_DECISION", "ACCESS_REVOKED", "OVERPAYMENT_REQUIRES_CONTACT"]) {
    assert.match(decisionRoute, new RegExp(`PaymentDecisionError && error\\.code === "${code}"`));
  }
  // Errors from the money side surface too, rather than falling through to a 500.
  assert.match(decisionRoute, /PaymentApplicationError && error\.code === "DUPLICATE_REPAYMENT"/);
  assert.match(decisionRoute, /PaymentApplicationError && error\.code === "LOAN_NOT_DISBURSED"/);
  assert.match(decisionRoute, /\["P2002", "P2034"\]\.includes\(error\.code\)/);
});

test("the contract says which id these routes take", () => {
  // A payment response carries id, installmentId AND installment.id. Reaching for the wrong one
  // gets a bare 404, so the spec has to name the right one.
  const spec = JSON.parse(read("public/openapi.json"));
  const paymentPaths = [
    "/admin/payments/{id}",
    "/admin/payments/{id}/decision",
    "/payments/{id}/slip",
  ];

  for (const path of paymentPaths) {
    const operation = Object.values(spec.paths[path])[0];
    const parameter = operation.parameters.find((entry) => entry.name === "id");
    assert.ok(parameter, `${path} must document its id parameter`);
    assert.match(parameter.description ?? "", /installmentId/, `${path} must disambiguate the id`);
    assert.equal(parameter.schema.format, "uuid", `${path} id is a uuid`);
    assert.match(parameter.example ?? "", /^[0-9a-f-]{36}$/, `${path} needs a usable example`);
  }
});

test("the review queue is oldest-first and only shows what is pending", () => {
  assert.match(review, /where: \{ status: "pending_review" \}/);
  assert.match(review, /orderBy: \[\{ createdAt: "asc" \}, \{ id: "asc" \}\]/);
});
