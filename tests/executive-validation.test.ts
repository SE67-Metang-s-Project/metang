import assert from "node:assert/strict";
import { test } from "node:test";
import { parseExecutiveDecisionInput } from "@/lib/loan-validation";

test("parses approved Executive decisions", () => {
  assert.deepEqual(parseExecutiveDecisionInput({ decision: "approved" }), {
    decision: "approved",
    comment: null,
  });
  assert.deepEqual(parseExecutiveDecisionInput({ decision: "approved", comment: "  okay  " }), {
    decision: "approved",
    comment: "okay",
  });
});

test("parses and trims rejected comments", () => {
  assert.deepEqual(parseExecutiveDecisionInput({ decision: "rejected", comment: "  policy reason  " }), {
    decision: "rejected",
    comment: "policy reason",
  });
});

test("rejects invalid Executive decision bodies", () => {
  for (const value of [null, [], "approved", { decision: "returned", comment: "fix it" }]) {
    assert.throws(() => parseExecutiveDecisionInput(value), /body|decision/i);
  }
  assert.throws(() => parseExecutiveDecisionInput({ decision: "rejected", comment: " " }), /comment/i);
  assert.throws(() => parseExecutiveDecisionInput({ decision: "rejected", comment: 42 }), /comment/i);
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected", comment: "x".repeat(2001) }),
    /comment/i,
  );
});
