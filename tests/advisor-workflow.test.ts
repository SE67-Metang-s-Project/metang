import assert from "node:assert/strict";
import { test } from "node:test";
import { isLoanId, parseLoanDecisionInput } from "@/lib/loan-validation";

test("parseLoanDecisionInput parses approved decisions with optional comment", () => {
  assert.deepEqual(parseLoanDecisionInput({ decision: "approved" }), {
    decision: "approved",
    comment: null,
  });

  assert.deepEqual(parseLoanDecisionInput({ decision: "approved", comment: "  เห็นชอบ  " }), {
    decision: "approved",
    comment: "เห็นชอบ",
  });
});

test("parseLoanDecisionInput requires comments for returned decisions", () => {
  assert.deepEqual(parseLoanDecisionInput({ decision: "returned", comment: "กรุณาแนบเลขบัญชีใหม่" }), {
    decision: "returned",
    comment: "กรุณาแนบเลขบัญชีใหม่",
  });

  assert.throws(
    () => parseLoanDecisionInput({ decision: "returned", comment: "" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseLoanDecisionInput({ decision: "returned", comment: "   " }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseLoanDecisionInput({ decision: "returned" }),
    /A comment is required for this decision/,
  );
});

test("parseLoanDecisionInput requires comments for rejected decisions", () => {
  assert.deepEqual(parseLoanDecisionInput({ decision: "rejected", comment: "ไม่ผ่านเกณฑ์การกู้ยืม" }), {
    decision: "rejected",
    comment: "ไม่ผ่านเกณฑ์การกู้ยืม",
  });

  assert.throws(
    () => parseLoanDecisionInput({ decision: "rejected", comment: "" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseLoanDecisionInput({ decision: "rejected", comment: "   " }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseLoanDecisionInput({ decision: "rejected" }),
    /A comment is required for this decision/,
  );
});

test("isLoanId accepts UUIDs and generated REQ request IDs", () => {
  assert.equal(isLoanId("8f75e498-a59b-4c74-8053-43d3e159b457"), true);
  assert.equal(isLoanId("REQ202609060013"), true);
  assert.equal(isLoanId("REQ-2609-001"), true);
  assert.equal(isLoanId("REQ_12345"), true);

  assert.equal(isLoanId(""), false);
  assert.equal(isLoanId("invalid-id"), false);
  assert.equal(isLoanId("12345"), false);
});
