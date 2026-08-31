import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const notificationStatuses = ["pending", "processing", "retry", "delivered", "failed"];

function section(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return source.slice(from, to);
}

function notificationBlocks(source) {
  return [...source.matchAll(/await enqueueNotification\(tx,\s*\{([\s\S]*?)\n\s*\}\);/g)].map(
    ([, block]) => block,
  );
}

function responseRef(document, path, method, status = "200") {
  const response = document.paths?.[path]?.[method]?.responses?.[status];
  assert.ok(response, `missing ${method.toUpperCase()} ${path} response ${status}`);
  return response.content?.["application/json"]?.schema?.$ref;
}

test("notification outbox declares fields, indexes, and statuses", () => {
  const schema = read("db/schema.prisma");
  const outbox = section(schema, "model NotificationOutbox {", "\n}\n\nmodel UserRole");

  for (const field of ["id", "dedupeKey", "eventType", "payload", "status", "attemptCount", "availableAt", "deliveredAt", "lastError", "createdAt", "updatedAt"]) {
    assert.match(outbox, new RegExp(`\\b${field}\\b`), `missing outbox field: ${field}`);
  }
  assert.match(outbox, /dedupeKey\s+String\s+@unique\(map: "notification_outbox_dedupe_key"\)/);
  assert.match(outbox, /eventType\s+String\s+@map\("event_type"\)/);
  assert.match(outbox, /payload\s+Json\s+@db\.JsonB/);
  assert.match(outbox, /status\s+NotificationStatus\s+@default\(pending\)/);
  assert.match(outbox, /attemptCount\s+Int\s+@default\(0\)\s+@map\("attempt_count"\)/);
  assert.match(outbox, /@@index\(\[status, availableAt\], map: "notification_outbox_status_available_at_idx"\)/);

  const statuses = section(schema, "enum NotificationStatus {", "\n}\n\nenum UserRoleName");
  for (const status of notificationStatuses) assert.match(statuses, new RegExp(`\\b${status}\\b`));

  const migration = read("db/migrations/20260817163556_notification_outbox/migration.sql");
  assert.match(
    migration,
    /CREATE TYPE "notification_status" AS ENUM \('pending', 'processing', 'retry', 'delivered', 'failed'\)/,
  );
  for (const field of ["dedupe_key", "event_type", "payload", "status", "attempt_count", "available_at", "delivered_at", "last_error", "created_at", "updated_at"]) {
    assert.match(migration, new RegExp(`"${field}"`), `missing migrated outbox field: ${field}`);
  }
  assert.match(migration, /CREATE UNIQUE INDEX "notification_outbox_dedupe_key"/);
  assert.match(migration, /CREATE INDEX "notification_outbox_status_available_at_idx"/);
});

test("notification payloads and advisor selections exclude bank fields", () => {
  assert.doesNotMatch(read("db/queries/notifications.ts"), /bankName|bankAccountNo|bankAccountName/);

  const advisorSelect = section(
    read("db/queries/loan-requests.ts"),
    "export const advisorLoanSelect = {",
    "} satisfies Prisma.LoanRequestSelect;",
  );
  for (const field of bankFields) assert.doesNotMatch(advisorSelect, new RegExp(`\\b${field}\\b`));

  for (const file of [
    "app/api/student/loan-requests/route.ts",
    "app/api/student/loan-requests/[id]/resubmit/route.ts",
    "db/queries/loan-requests.ts",
  ]) {
    const blocks = notificationBlocks(read(file));
    assert.ok(blocks.length > 0, `missing notification enqueue in ${file}`);
    for (const block of blocks) {
      for (const field of bankFields) assert.doesNotMatch(block, new RegExp(`\\b${field}\\b`));
    }
  }
});

test("workflow sources keep transactions, enqueue events, and CAS guards together", () => {
  const initial = read("app/api/student/loan-requests/route.ts");
  assert.match(initial, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(initial, /await tx\.loanRequest\.create\(/);
  assert.match(initial, /await tx\.loanApproval\.create\(/);
  assert.match(initial, /await tx\.auditLog\.create\(/);
  assert.equal(notificationBlocks(initial).length, 1);
  assert.match(initial, /dedupeKey:\s*`loan:\$\{created\.id\}:review:advisor:1`/);

  const resubmit = read("app/api/student/loan-requests/[id]/resubmit/route.ts");
  assert.match(resubmit, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(
    resubmit,
    /const updated = await tx\.loanRequest\.updateMany\([\s\S]*?where:\s*\{ id, studentId: context\.user\.id, status: "returned" \}/,
  );
  assert.match(resubmit, /if \(updated\.count !== 1\) throw new Error\("STALE_RESUBMIT"\)/);
  assert.equal(notificationBlocks(resubmit).length, 1);
  assert.match(resubmit, /dedupeKey:\s*`loan:\$\{id\}:review:\$\{step\}:\$\{attempt\}`/);

  const advisorDecision = read("db/queries/loan-requests.ts");
  assert.match(advisorDecision, /return prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(advisorDecision, /if \(current\.status !== "pending_advisor"\)/);
  assert.match(
    advisorDecision,
    /const changed = await tx\.loanRequest\.updateMany\([\s\S]*?where: \{ id, advisorId, status: "pending_advisor" \}/,
  );
  assert.match(advisorDecision, /if \(changed\.count !== 1\) throw new AdvisorDecisionError\("STALE_DECISION"\)/);
  assert.match(advisorDecision, /if \(decision === "approved"\) \{[\s\S]*?await enqueueNotification\(tx/);
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
