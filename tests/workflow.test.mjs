import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const bankFields = ["bankName", "bankAccountNo", "bankAccountName"];
const loanStatuses = [
  "draft",
  "returned",
  "pending_advisor",
  "pending_admin",
  "pending_executive",
  "pending_disbursement",
  "disbursed",
  "closed",
  "rejected",
  "cancelled",
];
function responseRef(document, path, method, status = "200") {
  const response = document.paths?.[path]?.[method]?.responses?.[status];
  assert.ok(response, `missing ${method.toUpperCase()} ${path} response ${status}`);
  return response.content?.["application/json"]?.schema?.$ref;
}

test("notification persistence remains stateless", () => {
  const schema = read("db/schema.prisma");
  assert.doesNotMatch(schema, /model NotificationOutbox/);
  assert.doesNotMatch(schema, /enum NotificationStatus/);
  assert.equal(existsSync(resolve(root, "db/queries/notifications.ts")), false);
});

test("workflow sources keep transactions and CAS guards together", () => {
  const initial = read("app/api/student/loan-requests/route.ts");
  assert.match(initial, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(initial, /await tx\.loanRequest\.create\(/);
  assert.match(initial, /await tx\.loanApproval\.create\(/);
  assert.match(initial, /await tx\.auditLog\.create\(/);
  assert.doesNotMatch(initial, /enqueueNotification/);

  const resubmit = read("app/api/student/loan-requests/[id]/resubmit/route.ts");
  assert.match(resubmit, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(
    resubmit,
    /const updated = await tx\.loanRequest\.updateMany\([\s\S]*?where:\s*\{ id, studentId: context\.user\.id, status: "returned" \}/,
  );
  assert.match(resubmit, /if \(updated\.count !== 1\) throw new Error\("STALE_RESUBMIT"\)/);
  assert.doesNotMatch(resubmit, /enqueueNotification/);

  const advisorDecision = read("db/queries/loan-requests.ts");
  assert.match(advisorDecision, /return prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(advisorDecision, /if \(current\.status !== "pending_advisor"\)/);
  assert.match(
    advisorDecision,
    /const changed = await tx\.loanRequest\.updateMany\([\s\S]*?where: \{ id, advisorId, status: "pending_advisor" \}/,
  );
  assert.match(advisorDecision, /if \(changed\.count !== 1\) throw new AdvisorDecisionError\("STALE_DECISION"\)/);
  assert.doesNotMatch(advisorDecision, /enqueueNotification/);
});

test("OpenAPI exposes student paths, advisor paths, and bank privacy", () => {
  const document = JSON.parse(read("public/openapi.json"));
  const expectedPaths = [
    ["/student/loan-requests", "get", "LoanRequestDetailListResponse"],
    ["/student/loan-requests", "post", "LoanRequestDetailResponse", "201"],
    ["/student/loan-requests/current", "get", "LoanRequestCurrentResponse"],
    ["/student/loan-requests/{id}", "get", "LoanRequestDetailResponse"],
    ["/student/loan-requests/{id}/resubmit", "post", "LoanRequestDetailResponse"],
    ["/advisor/loan-requests", "get", "AdvisorQueueResponse"],
    ["/advisor/loan-requests/{id}", "get", "AdvisorLoanRequestDetailResponse"],
    ["/advisor/loan-requests/{id}/decision", "post", "AdvisorLoanRequestDetailResponse"],
  ];
  for (const [path, method, schema, status] of expectedPaths) {
    assert.equal(responseRef(document, path, method, status), `#/components/schemas/${schema}`);
  }

  for (const name of ["AdvisorQueueItem", "AdvisorLoanRequestDetail"]) {
    const schema = document.components.schemas[name];
    assert.ok(schema, `missing OpenAPI schema: ${name}`);
    for (const field of bankFields) assert.equal(schema.properties?.[field], undefined, `${name}.${field}`);
    assert.deepEqual(schema.properties?.status?.enum, loanStatuses);
  }

  const student = document.components.schemas.LoanRequestDetail;
  assert.ok(student, "missing OpenAPI schema: LoanRequestDetail");
  for (const field of bankFields) assert.ok(student.properties?.[field], `LoanRequestDetail.${field}`);
  assert.deepEqual(student.properties?.status?.enum, loanStatuses);
});
