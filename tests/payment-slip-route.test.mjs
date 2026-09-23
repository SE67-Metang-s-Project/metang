import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const route = read("app/api/payments/[id]/slip/route.ts");
const fundRoute = read("app/api/fund-transactions/[id]/slip/route.ts");
const access = read("lib/slip-access.ts");

test("the storage path is never returned - the route 302s to a freshly signed URL", () => {
  // The bucket is private and has no RLS, so this route is the only way to read a repayment slip.
  assert.match(route, /const url = await signSlipUrl\(\{ path: payment\.slipPath \}\);/);
  assert.match(route, /status: 302/);
  assert.match(route, /headers: \{ Location: url, "Cache-Control": "no-store" \}/);

  // A signed URL is minted per request and never persisted, so nothing may echo the raw path.
  assert.doesNotMatch(route, /apiOk\(/);
  assert.doesNotMatch(route, /slipPath:\s*payment\.slipPath/);
});

test("authorization: signed in, then every role checked, before anything is signed", () => {
  assert.match(route, /const context = await getSignedInContext\(\);/);
  assert.match(route, /if \(!context\) return apiError\("UNAUTHORIZED", "Authentication required", 401\);/);

  // A user can hold several roles; any one granting read is enough.
  assert.match(
    route,
    /context\.user\.roles\.some\(\(\{ role \}\) =>\s*canReadRepaymentSlip\(role, context\.user\.id, payment\),\s*\)/,
  );
  assert.match(route, /if \(!allowed\) return apiError\("FORBIDDEN", "Not allowed to read this slip", 403\);/);

  // The check must precede the signing call, or a forbidden caller still gets a usable URL.
  assert.ok(route.indexOf("if (!allowed)") < route.indexOf("await signSlipUrl("));
});

test("advisors can never read a repayment slip", () => {
  // Enforced in the shared rule, not the route: canReadRepaymentSlip falls through to false for
  // every role it does not name, and advisor is deliberately not named.
  assert.match(access, /export function canReadRepaymentSlip\(/);
  assert.doesNotMatch(access, /actorRole === "advisor"/);
});

test("a malformed id is 422 and names the id; a missing slip is 404", () => {
  // Payment.id is a uuid - unlike the fund transaction route, whose id is a BigInt. A payment also
  // carries installmentId, so the error says which one is wanted instead of a bare 404.
  assert.match(route, /"id must be a payment uuid, not an installment id", 422/);
  assert.match(route, /if \(!payment\?\.slipPath\) return apiError\("NOT_FOUND", "Slip not found", 404\);/);
  assert.match(route, /select: \{ slipPath: true, loan: \{ select: \{ studentId: true \} \} \}/);

  // Anyone signed in can reach this route, so authentication precedes validation - an anonymous
  // caller gets 401, not a hint about the id format.
  assert.ok(route.indexOf("getSignedInContext()") < route.indexOf("isUuid(id)"));
});

test("stays in step with the disbursement slip route it mirrors", () => {
  // Both routes solve the same problem; if one gains a guard the other should too.
  for (const shared of [
    /const context = await getSignedInContext\(\);/,
    /"Cache-Control": "no-store"/,
    /status: 302/,
    /roles\.some\(/,
    /return apiError\("INTERNAL_ERROR", "Unable to read slip", 500\);/,
  ]) {
    assert.match(route, shared);
    assert.match(fundRoute, shared);
  }
});

test("the OpenAPI contract documents a 302, not a JSON body", () => {
  assert.match(route, /@tag Payment slips/);
  assert.match(route, /@pathParams PaymentIdParams/);
  assert.match(route, /@auth cookieAuth/);
  assert.match(route, /@response 302/);
  for (const status of [401, 403, 404, 500]) {
    assert.match(route, new RegExp(`@add ${status}:ApiErrorResponse`));
  }

  const types = read("lib/loan-api-types.ts");
  assert.match(types, /export type PaymentIdParams = \{\s*id: string;\s*\};/);
});
