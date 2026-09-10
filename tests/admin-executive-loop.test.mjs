import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("schema persists Admin ownership and approval creation time", () => {
  const schema = read("db/schema.prisma");
  assert.match(schema, /assignedAdminId\s+String\?/);
  assert.match(schema, /assigned_admin_id/);
  assert.match(schema, /assignedAdminLoans/);
  assert.match(schema, /createdAt\s+DateTime\s+@default\(now\(\)\).*created_at/);
  assert.match(schema, /loan_request_assigned_admin_idx/);
});

test("review history and attempts preserve chronological rounds", () => {
  const query = read("db/queries/loan-requests.ts");
  assert.match(query, /orderBy: \[\{ createdAt: "asc" \}, \{ id: "asc" \}\]/);
  assert.match(query, /assignedAdminId/);
});

test("Executive return reopens Admin ownership for another attempt; rejection stays terminal", () => {
  const query = read("db/queries/loan-requests.ts");
  const service = query.slice(query.indexOf("export type ExecutiveDecisionErrorCode"));
  assert.match(
    service,
    /nextStatus =\s*decision === "approved" \? "pending_disbursement" : decision === "returned" \? "pending_admin" : "rejected"/,
  );
  assert.match(service, /status: nextStatus/);
  assert.match(service, /assignedAdminId: decision === "returned" \? current\.assignedAdminId : null/);
  assert.match(
    service,
    /tx\.loanApproval\.create\(\{\s*data: \{ loanId: id, step: "admin", attempt: pending\.attempt \+ 1 \}/,
  );
  assert.match(read("lib/loan-validation.ts"), /ExecutiveDecision = LoanDecision/);
});

test("Admin routes use non-leaking ownership visibility", () => {
  for (const file of [
    "app/api/admin/loan-requests/route.ts",
    "app/api/admin/loan-requests/[id]/route.ts",
  ]) {
    assert.match(read(file), /assignedAdminId/);
    assert.match(read(file), /access\.context\.user\.id/);
  }
});

test("development access bypasses identity selection or selects the configured role identity", () => {
  const auth = read("lib/loan-auth.ts");
  const developmentAccess = read("lib/development-access.ts");

  assert.match(developmentAccess, /DEV_AS_ADVISOR/);
  assert.match(developmentAccess, /DEV_AS_ADMIN/);
  assert.match(developmentAccess, /DEV_AS_SUPERADMIN/);
  assert.match(developmentAccess, /DEV_AS_EXECUTIVE/);
  assert.match(developmentAccess, /export function isDevelopmentApiBypass/);
  assert.match(developmentAccess, /export function isDevelopmentRoleEnabled/);
  assert.match(auth, /isDevelopmentApiBypass\(\)/);
  assert.match(auth, /developmentRole/);
  assert.match(auth, /DEVELOPMENT_USER_IDS/);
  assert.match(auth, /getDevelopmentStudentContext/);
  assert.doesNotMatch(auth, /DEV_API_USER_ID/);
});
