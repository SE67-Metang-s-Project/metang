import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFundTransactionInput } from "@/lib/loan-validation";

test("parses a top-up without a note", () => {
  assert.deepEqual(parseFundTransactionInput({ kind: "top_up", amount: 1000 }), {
    kind: "top_up",
    amount: 1000,
    note: null,
  });
});

test("parses withdrawal and adjustment kinds with a trimmed note", () => {
  for (const kind of ["withdrawal", "credit_adjustment", "debit_adjustment"]) {
    assert.deepEqual(parseFundTransactionInput({ kind, amount: 500, note: "  reason  " }), {
      kind,
      amount: 500,
      note: "reason",
    });
  }
});

test("requires a note for withdrawal and adjustment kinds", () => {
  for (const kind of ["withdrawal", "credit_adjustment", "debit_adjustment"]) {
    assert.throws(() => parseFundTransactionInput({ kind, amount: 500 }), /note/i);
    assert.throws(() => parseFundTransactionInput({ kind, amount: 500, note: "   " }), /note/i);
  }
});

test("rejects disbursement and repayment kinds - those are written by other code paths", () => {
  assert.throws(() => parseFundTransactionInput({ kind: "disbursement", amount: 500 }), /kind/i);
  assert.throws(() => parseFundTransactionInput({ kind: "repayment", amount: 500 }), /kind/i);
});

test("rejects invalid amounts and malformed bodies", () => {
  assert.throws(() => parseFundTransactionInput({ kind: "top_up", amount: 0 }), /amount/i);
  assert.throws(() => parseFundTransactionInput({ kind: "top_up", amount: -1 }), /amount/i);
  assert.throws(() => parseFundTransactionInput({ kind: "top_up", amount: 1.5 }), /amount/i);
  for (const value of [null, [], "top_up", { kind: "bogus", amount: 1 }]) {
    assert.throws(() => parseFundTransactionInput(value), /body|kind/i);
  }
});

test("rejects a note over the 2000 character limit", () => {
  assert.throws(
    () => parseFundTransactionInput({ kind: "withdrawal", amount: 500, note: "x".repeat(2001) }),
    /note/i,
  );
});
