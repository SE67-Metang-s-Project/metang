import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const route = read("app/api/payments/[id]/slip/route.ts");
const fundRoute = read("app/api/fund-transactions/[id]/slip/route.ts");
const access = read("lib/slip-access.ts");

test("no storage path or URL is ever returned - the route streams the slip itself", () => {
  // The bucket is private and has no RLS, so this route is the only way to read a repayment slip.
  // A signed URL would be a bearer link anyone could open until it expired, so none is minted;
  // lib/slip-storage.ts serveSlip sets the type, private cache, Vary: Cookie and nosniff.
  assert.match(route, /return await serveSlip\(\{ path: payment\.slipPath \}\);/);
  assert.doesNotMatch(route, /status: 302/);
  assert.doesNotMatch(route, /Location/);
  assert.doesNotMatch(route, /signSlipUrl/);

  assert.doesNotMatch(route, /apiOk\(/);
  assert.doesNotMatch(route, /slipPath:\s*payment\.slipPath/);
});

test("authorization: signed in, then every role checked, before anything is served", () => {
  assert.match(route, /const context = await getSignedInContext\(\);/);
  assert.match(route, /if \(!context\) return apiError\("UNAUTHORIZED", "Authentication required", 401\);/);

  // A user can hold several roles; any one granting read is enough.
  assert.match(
    route,
    /context\.user\.roles\.some\(\(\{ role \}\) =>\s*canReadRepaymentSlip\(role, context\.user\.id, payment\),\s*\)/,
  );
  assert.match(route, /if \(!allowed\) return apiError\("FORBIDDEN", "Not allowed to read this slip", 403\);/);

  // The check must precede the download, or a forbidden caller still gets the slip.
  assert.ok(route.indexOf("if (!allowed)") < route.indexOf("await serveSlip("));
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
  // caller gets 401, not a hint about the id format. The lookup starts before auth so the two
  // overlap, but only for a well-formed uuid: Prisma rejects anything else (P2007).
  assert.match(route, /const lookup = isUuid\(id\)\s*\? prisma\.payment\.findUnique\(/);
  assert.ok(route.indexOf('"UNAUTHORIZED"') < route.indexOf('"VALIDATION_ERROR"'));
});

test("stays in step with the disbursement slip route it mirrors", () => {
  // Both routes solve the same problem; if one gains a guard the other should too.
  for (const shared of [
    /const context = await getSignedInContext\(\);/,
    /return await serveSlip\(\{ path: \w+\.slipPath \}\);/,
    /roles\.some\(/,
    /return apiError\("INTERNAL_ERROR", "Unable to read slip", 500\);/,
    // Starts the lazy PrismaPromise so it overlaps auth, and keeps an early return from leaving
    // an unhandled rejection behind.
    /lookup\??\.catch\(\(\) => \{\}\);/,
  ]) {
    assert.match(route, shared);
    assert.match(fundRoute, shared);
  }

  // Lookup started, then auth awaited, then the lookup awaited inside the try (so a DB error is
  // still the JSON 500) - and a 401 never waits on or reads the lookup.
  for (const source of [route, fundRoute]) {
    assert.ok(source.indexOf("const lookup =") < source.indexOf("await getSignedInContext()"));
    assert.ok(source.indexOf("await getSignedInContext()") < source.indexOf("= await lookup;"));
    assert.ok(source.indexOf("try {") < source.indexOf("= await lookup;"));
  }
  // BigInt(id) now runs outside the try, so the digits-only guard must come first.
  assert.match(fundRoute, /const lookup = prisma\.fundTransaction\.findUnique\(/);
  assert.ok(fundRoute.indexOf("/^\\d{1,18}$/.test(id)") < fundRoute.indexOf("id: BigInt(id)"));
});

test("the OpenAPI contract documents the file itself, not a redirect or a JSON body", () => {
  assert.match(route, /@tag Payment slips/);
  assert.match(route, /@pathParams PaymentIdParams/);
  assert.match(route, /@auth cookieAuth/);
  // scripts/normalize-openapi.mjs restates the 200 as the allowed image types.
  assert.match(route, /@response 200\n/);
  for (const status of [401, 403, 404, 500]) {
    assert.match(route, new RegExp(`@add ${status}:ApiErrorResponse`));
  }

  const types = read("lib/loan-api-types.ts");
  assert.match(types, /export type PaymentIdParams = \{\s*id: string;\s*\};/);
});
