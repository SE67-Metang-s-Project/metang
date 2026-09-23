import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isLoanId,
  parseAdvisorDecisionInput,
  parseExecutiveDecisionInput,
} from "@/lib/loan-validation";

test("parseExecutiveDecisionInput parses approved decisions with optional comment", () => {
  assert.deepEqual(parseExecutiveDecisionInput({ decision: "approved" }), {
    decision: "approved",
    comment: null,
  });

  assert.deepEqual(parseExecutiveDecisionInput({ decision: "approved", comment: "  เห็นชอบ  " }), {
    decision: "approved",
    comment: "เห็นชอบ",
  });
});

test("parseExecutiveDecisionInput requires comments for returned decisions", () => {
  assert.deepEqual(
    parseExecutiveDecisionInput({ decision: "returned", comment: "กรุณาแนบเลขบัญชีใหม่" }),
    {
      decision: "returned",
      comment: "กรุณาแนบเลขบัญชีใหม่",
    },
  );

  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "returned", comment: "" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "returned", comment: "   " }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "returned" }),
    /A comment is required for this decision/,
  );
});

test("parseExecutiveDecisionInput requires comments for rejected decisions", () => {
  assert.deepEqual(
    parseExecutiveDecisionInput({ decision: "rejected", comment: "ไม่ผ่านเกณฑ์การกู้ยืม" }),
    {
      decision: "rejected",
      comment: "ไม่ผ่านเกณฑ์การกู้ยืม",
    },
  );

  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected", comment: "" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected", comment: "   " }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected" }),
    /A comment is required for this decision/,
  );
});

test("parseAdvisorDecisionInput always requires a comment, including on approval", () => {
  assert.deepEqual(parseAdvisorDecisionInput({ decision: "approved", comment: "เห็นชอบ" }), {
    decision: "approved",
    comment: "เห็นชอบ",
  });

  assert.throws(
    () => parseAdvisorDecisionInput({ decision: "approved" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseAdvisorDecisionInput({ decision: "approved", comment: "   " }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseAdvisorDecisionInput({ decision: "returned" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseAdvisorDecisionInput({ decision: "rejected" }),
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
