import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const read = (file) => readFileSync(resolve(import.meta.dirname, "..", file), "utf8");

// An executive return goes back only to the admin who forwarded it. The server-rendered Admin and
// SuperAdmin pages must hide it from everyone else, like GET /api/admin/loan-requests does.
test("the admin page lists hide another admin's pending_admin loan", () => {
  const queries = read("db/queries/loan-requests.ts");
  const helper = queries.slice(queries.indexOf("const assignedToViewerOrNoOne"));
  assert.match(
    helper.slice(0, helper.indexOf("\n];")),
    /\{ assignedAdminId: null \},\s*\{ assignedAdminId: viewerId \}/,
  );

  for (const name of ["getAdminQueueRequests", "getAdminQueuePage", "getAdminDashboardRequests"]) {
    const fn = queries.slice(queries.indexOf(`export async function ${name}`));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    assert.match(body.split("\n")[0], /\(viewerId: string[,)]/, `${name} takes the viewer`);
    assert.match(body, /assignedToViewerOrNoOne\(viewerId\)/, name);
  }
  const queue = queries.slice(queries.indexOf("export async function getAdminQueueRequests"));
  assert.match(queue.slice(0, queue.indexOf("\n}\n")), /\{ status: \{ not: "pending_admin" \} \}/);
  const dashboard = queries.slice(queries.indexOf("export async function getAdminDashboardRequests"));
  assert.match(dashboard.slice(0, dashboard.indexOf("\n}\n")), /status: "pending_admin", OR: assignedToViewerOrNoOne\(viewerId\)/);
});

// The viewer is the session user the page already authenticated - the identity the decide route
// acts as - so the query no longer repeats the session lookup.
test("the admin pages pass the authenticated user to the queue queries", () => {
  for (const [file, fn] of [
    ["app/admin/page.tsx", "getAdminDashboardRequests"],
    ["app/admin/pending/page.tsx", "getAdminQueuePage"],
    ["app/superadmin/pending/page.tsx", "getAdminQueuePage"],
  ]) {
    const page = read(file);
    assert.match(page, /const context = await require(Admin|SuperAdmin)Access\(\);/, file);
    assert.match(page, new RegExp(`${fn}\\(context\\.user\\.id[,)]`), file);
  }
});

test("the admin decision is locked to the same assignment", () => {
  const queries = read("db/queries/loan-requests.ts");
  const fn = queries.slice(queries.indexOf("export async function decideAdminLoanRequest"));
  assert.match(fn, /OR: \[\{ assignedAdminId: null \}, \{ assignedAdminId: adminId \}\]/);
});
