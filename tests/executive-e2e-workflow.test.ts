import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  parseExecutiveDecisionInput,
  isLoanId,
} from "@/lib/loan-validation";


const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("Executive routes enforce cookieAuth and role check", () => {
  const routes = [
    "app/api/executive/loan-requests/route.ts",
    "app/api/executive/loan-requests/[id]/route.ts",
    "app/api/executive/loan-requests/[id]/decision/route.ts",
  ];

  for (const file of routes) {
    const content = read(file);
    assert.match(content, /getExecutiveAccess/);
    assert.match(content, /@auth cookieAuth/);
  }
});

test("Executive loan selection and queue query strictly prohibit bank details (NAT-117)", () => {
  const bankFields = ["bankName", "bankAccountNo", "bankAccountName"];

  // Verify query definition does not contain bank field selection
  const queryFile = read("db/queries/loan-requests.ts");
  const execSection = queryFile.slice(
    queryFile.indexOf("export const executiveLoanSelect"),
    queryFile.indexOf("const globalLoanSelect"),
  );
  for (const field of bankFields) {
    assert.doesNotMatch(
      execSection,
      new RegExp(`\\b${field}\\b`),
      `executiveLoanSelect definition must not reference ${field}`,
    );
  }
});

test("ExecutiveDecision parser allows only approved and rejected with required comments (NAT-120)", () => {
  // Approved decision
  assert.deepEqual(parseExecutiveDecisionInput({ decision: "approved" }), {
    decision: "approved",
    comment: null,
  });
  assert.deepEqual(
    parseExecutiveDecisionInput({ decision: "approved", comment: "  เห็นชอบ  " }),
    {
      decision: "approved",
      comment: "เห็นชอบ",
    },
  );

  // Rejected decision requires comment
  assert.deepEqual(
    parseExecutiveDecisionInput({ decision: "rejected", comment: "  วงเงินเกินโควตา  " }),
    {
      decision: "rejected",
      comment: "วงเงินเกินโควตา",
    },
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected", comment: "" }),
    /A comment is required for this decision/,
  );
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "rejected", comment: "   " }),
    /A comment is required for this decision/,
  );

  // Returning is strictly prohibited for Executive (only Advisor/Admin can return)
  assert.throws(
    () => parseExecutiveDecisionInput({ decision: "returned", comment: "แก้ไข" }),
    /decision is invalid/,
  );
});

test("Executive loan ID validation accepts both UUID and REQ formats (NAT-85)", () => {
  assert.equal(isLoanId("8f75e498-a59b-4c74-8053-43d3e159b457"), true);
  assert.equal(isLoanId("REQ202609060013"), true);
  assert.equal(isLoanId("REQ-2026-9999"), true);
  assert.equal(isLoanId(""), false);
  assert.equal(isLoanId("invalid-id"), false);
});

test("Executive UI hides return button and protects bank details (NAT-117, NAT-119)", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");

  // "ส่งกลับแก้ไข" button is hidden when userRole === "executive"
  assert.match(
    requestsCard,
    /userRole !== "executive"[\s\S]*?ส่งกลับแก้ไข/,
    "RequestsCard must guard return button against executive role",
  );

  // Bank details section is guarded by canViewSensitiveData
  assert.match(
    requestsCard,
    /const canViewSensitiveData = userRole === "admin" \|\| userRole === "super_admin";/,
  );
  assert.match(
    requestsCard,
    /ข้อมูลบัญชีธนาคารสงวนสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ/,
  );
});

test("OpenAPI documents all Executive endpoints and matches NAT-85 contract", () => {
  const document = JSON.parse(read("public/openapi.json"));

  // Queue endpoint
  const queueGet = document.paths?.["/executive/loan-requests"]?.get;
  assert.ok(queueGet, "missing /executive/loan-requests GET");
  assert.ok(
    queueGet.security?.some((s: Record<string, unknown>) => "cookieAuth" in s),
  );

  // Detail endpoint
  const detailGet = document.paths?.["/executive/loan-requests/{id}"]?.get;
  assert.ok(detailGet, "missing /executive/loan-requests/{id} GET");
  assert.ok(
    detailGet.security?.some((s: Record<string, unknown>) => "cookieAuth" in s),
  );

  // Decision endpoint
  const decisionPost = document.paths?.["/executive/loan-requests/{id}/decision"]?.post;
  assert.ok(decisionPost, "missing /executive/loan-requests/{id}/decision POST");
  assert.ok(
    decisionPost.security?.some((s: Record<string, unknown>) => "cookieAuth" in s),
  );

  // Responses
  for (const status of ["200", "401", "403", "404", "409", "422", "500"]) {
    assert.ok(
      decisionPost.responses?.[status],
      `decision endpoint must declare response ${status}`,
    );
  }

  // Schema checks
  const bodySchema = document.components?.schemas?.ExecutiveDecisionBody;
  assert.ok(bodySchema);
  assert.doesNotMatch(JSON.stringify(bodySchema), /returned/);
});
