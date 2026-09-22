import assert from "node:assert/strict";
import test from "node:test";

import { parseStudentPaymentInput } from "@/lib/loan-validation";

test("amount arrives as a multipart string and must be whole baht", () => {
  assert.equal(parseStudentPaymentInput({ amount: "500" }).amount, 500);
  assert.equal(parseStudentPaymentInput({ amount: " 1500 " }).amount, 1500);

  for (const amount of ["0", "-1", "12.5", "abc", "", "  ", null, undefined, "1e999"]) {
    assert.throws(() => parseStudentPaymentInput({ amount }), /amount is invalid/, `${amount}`);
  }
});

test("amount cannot exceed what the money column holds", () => {
  assert.equal(parseStudentPaymentInput({ amount: "2147483647" }).amount, 2_147_483_647);
  assert.throws(() => parseStudentPaymentInput({ amount: "2147483648" }), /amount is invalid/);
});

test("paidAt is optional and defaults to null", () => {
  for (const paidAt of [undefined, null, ""]) {
    assert.equal(parseStudentPaymentInput({ amount: "500", paidAt }).paidAt, null);
  }
});

test("paidAt parses an ISO timestamp", () => {
  const parsed = parseStudentPaymentInput({ amount: "500", paidAt: "2026-09-20T03:00:00.000Z" });
  assert.equal(parsed.paidAt?.toISOString(), "2026-09-20T03:00:00.000Z");
});

test("a transfer cannot have happened in the future", () => {
  // A future date would misreport a late payment as on time once conduct is derived from it.
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  assert.throws(
    () => parseStudentPaymentInput({ amount: "500", paidAt: future }),
    /paidAt cannot be in the future/,
  );
});

test("a malformed paidAt is rejected rather than silently becoming Invalid Date", () => {
  for (const paidAt of ["yesterday", "2026-13-45", 12345]) {
    assert.throws(() => parseStudentPaymentInput({ amount: "500", paidAt }), /paidAt is invalid/);
  }
});
