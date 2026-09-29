import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const read = (file) => readFileSync(resolve(import.meta.dirname, "..", file), "utf8");

// An executive return goes back only to the admin who forwarded it. The server-rendered Admin and
// SuperAdmin pages must hide it from everyone else, like GET /api/admin/loan-requests does.
test("the admin page list hides another admin's pending_admin loan", () => {
  const queries = read("db/queries/loan-requests.ts");
  const fn = queries.slice(queries.indexOf("export async function getAdminActionRequests"));
  const body = fn.slice(0, fn.indexOf("\n}\n"));
  assert.match(body, /const access = await getAdminAccess\(\);/);
  assert.match(body, /if \(access\.status !== "authorized"\) return \[\];/);
  assert.match(body, /\{ status: \{ not: "pending_admin" \} \}/);
  assert.match(body, /\{ assignedAdminId: null \}/);
  assert.match(body, /\{ assignedAdminId: viewerId \}/);
});

test("every admin and superadmin page loads through that filtered list", () => {
  for (const page of [
    "app/admin/page.tsx",
    "app/admin/pending/page.tsx",
    "app/admin/verify-slip/page.tsx",
    "app/superadmin/pending/page.tsx",
    "app/superadmin/verify-slip/page.tsx",
  ]) {
    assert.match(read(page), /getAdminActionRequests\(\)/, page);
  }
});

test("the admin decision is locked to the same assignment", () => {
  const queries = read("db/queries/loan-requests.ts");
  const fn = queries.slice(queries.indexOf("export async function decideAdminLoanRequest"));
  assert.match(fn, /OR: \[\{ assignedAdminId: null \}, \{ assignedAdminId: adminId \}\]/);
});
