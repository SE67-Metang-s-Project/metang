import assert from "node:assert/strict";
import test from "node:test";

import { parsePaymentDecisionInput } from "@/lib/loan-validation";

test("accepts the two review outcomes and nothing else", () => {
  assert.deepEqual(parsePaymentDecisionInput({ decision: "confirmed" }), {
    decision: "confirmed",
    note: null,
  });

  for (const decision of ["approved", "returned", "pending_review", "", null, 1, undefined]) {
    assert.throws(() => parsePaymentDecisionInput({ decision }), /decision is invalid/);
  }
});

test("a rejection must say why - the student is shown this note", () => {
  assert.throws(() => parsePaymentDecisionInput({ decision: "rejected" }), /note is required/i);
  assert.throws(
    () => parsePaymentDecisionInput({ decision: "rejected", note: "   " }),
    /note is required/i,
  );

  assert.deepEqual(parsePaymentDecisionInput({ decision: "rejected", note: "ยอดไม่ตรงสลิป" }), {
    decision: "rejected",
    note: "ยอดไม่ตรงสลิป",
  });
});

test("a confirmation may carry a note but does not need one", () => {
  assert.equal(parsePaymentDecisionInput({ decision: "confirmed", note: null }).note, null);
  assert.equal(parsePaymentDecisionInput({ decision: "confirmed", note: "  " }).note, null);
  assert.equal(parsePaymentDecisionInput({ decision: "confirmed", note: " ok " }).note, "ok");
});

test("the note is trimmed and capped", () => {
  assert.equal(
    parsePaymentDecisionInput({ decision: "rejected", note: "  ยอดไม่ตรง  " }).note,
    "ยอดไม่ตรง",
  );
  assert.throws(
    () => parsePaymentDecisionInput({ decision: "rejected", note: "x".repeat(2001) }),
    /note is invalid/,
  );
  assert.equal(
    parsePaymentDecisionInput({ decision: "rejected", note: "x".repeat(2000) }).note?.length,
    2000,
  );
});

test("the amount can never be set from the request body", () => {
  // NAT-33: the payment amount is not editable. The parser has no amount field at all, so a
  // caller-supplied one is silently dropped rather than trusted.
  const parsed = parsePaymentDecisionInput({ decision: "confirmed", amount: 999999 }) as Record<
    string,
    unknown
  >;
  assert.equal("amount" in parsed, false);
});

test("rejects a non-object body", () => {
  for (const body of [null, undefined, "confirmed", 42, ["confirmed"]]) {
    assert.throws(() => parsePaymentDecisionInput(body), /request body is invalid/);
  }
});
