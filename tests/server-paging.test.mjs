import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const queries = read("db/queries/loan-requests.ts");
const fnBody = (name) => {
  const fn = queries.slice(queries.indexOf(`export async function ${name}`));
  return fn.slice(0, fn.indexOf("\n}\n"));
};

// Each list endpoint checks the same role as the page it feeds. A route that used a wider access
// function would hand another role's loans, bank accounts or slip links to the wrong user.
const routes = {
  "app/api/admin/verify-slip/route.ts": "getAdminAccess",
  "app/api/admin/disburse-debt/route.ts": "getAdminAccess",
  "app/api/admin/queue/route.ts": "getAdminAccess",
  "app/api/executive/queue/route.ts": "getExecutiveAccess",
  "app/api/executive/advisor-queue/route.ts": "getExecutiveAccess",
  "app/api/executive/students/route.ts": "getExecutiveAccess",
  "app/api/advisor/queue/route.ts": "getAdvisorAccess",
  "app/api/advisor/students/route.ts": "getAdvisorAccess",
};

test("each list route checks its role and answers 401/403 before reading anything", () => {
  for (const [file, access] of Object.entries(routes)) {
    assert.ok(existsSync(resolve(root, file)), file);
    const route = read(file);
    assert.match(route, new RegExp(`const access = await ${access}\\(\\);`), file);
    assert.match(route, /if \(access\.status !== "authorized"\) return accessError\(access,/, file);
    // The access check comes before the first query call.
    const dataCall = route.search(/await get\w+Page\(/);
    assert.ok(dataCall > route.indexOf("accessError("), `${file}: check first`);
    assert.match(route, /export async function GET/, file);
    assert.doesNotMatch(route, /export async function (POST|PUT|PATCH|DELETE)/, file);
    assert.match(route, /apiError\("VALIDATION_ERROR"/, `${file} validates its params`);
  }
});

test("the experiment's super-admin copies are gone: the admin routes serve both roles", () => {
  assert.equal(existsSync(resolve(root, "app/api/super-admin/verify-slip/route.ts")), false);
  assert.equal(existsSync(resolve(root, "app/api/super-admin/disburse-debt/route.ts")), false);
});

test("advisor routes scope by the session user, never by a client-sent id", () => {
  for (const file of ["app/api/advisor/queue/route.ts", "app/api/executive/advisor-queue/route.ts"]) {
    const route = read(file);
    assert.match(route, /getAdvisorQueuePage\(access\.context\.user\.id,/, file);
    assert.doesNotMatch(route, /searchParams\.get\("advisor/i, file);
  }
  assert.match(read("app/api/advisor/students/route.ts"), /\{ advisorId: access\.context\.user\.id \}/);
  assert.match(read("app/api/executive/students/route.ts"), /getStudentsPage\("all"/);
});

test("queue pages exclude drafts and keep the assignment rule", () => {
  assert.match(fnBody("getAdminQueuePage"), /status: \{ not: "draft" \}/);
  assert.match(fnBody("getAdminQueuePage"), /assignedToViewerOrNoOne\(viewerId\)/);
  assert.match(fnBody("getExecutiveQueuePage"), /status: \{ not: "draft" \}/);
  assert.match(fnBody("getAdvisorQueuePage"), /advisorId, status: \{ not: "draft" \}/);
  assert.match(read("app/api/admin/queue/route.ts"), /getAdminQueuePage\(access\.context\.user\.id/);
});

test("queue pages hand out the same field views as the pages they replace", () => {
  assert.match(fnBody("getAdminQueuePage"), /fullView/);
  assert.match(fnBody("getAdvisorQueuePage"), /advisorView/);
  assert.match(queries, /const executiveView: ActionRequestView = \{ bank: false, slipLinks: true, schedule: true, conduct: true \}/);
  assert.match(fnBody("getExecutiveQueuePage"), /executiveView/);
});

test("search and filters reach the database, not the client", () => {
  const body = queries.slice(queries.indexOf("async function getQueuePage"));
  assert.match(body, /statusesForFilter\(role, filter\)/);
  assert.match(body, /groupBy\(\{ by: \["status"\], where: base/);
  assert.match(body, /contains: term, mode: "insensitive"/);
});

test("the paged lists fetch through the shared hook, on the routes that check their role", () => {
  const endpoints = {
    "app/admin/pending/page.tsx": "/api/admin/queue",
    "app/superadmin/pending/page.tsx": "/api/admin/queue",
    "app/executive/pending-executive/page.tsx": "/api/executive/queue",
    "app/executive/pending-advisor/page.tsx": "/api/executive/advisor-queue",
    "app/advisor/pending/page.tsx": "/api/advisor/queue",
  };
  for (const [file, endpoint] of Object.entries(endpoints)) {
    assert.ok(read(file).includes(`endpoint: "${endpoint}"`), file);
    assert.ok(existsSync(resolve(root, `app${endpoint}/route.ts`)), endpoint);
  }
  assert.match(read("components/shared/verify-slip/SharedVerifySlipList.tsx"), /\/api\/admin\/verify-slip/);
  assert.match(read("components/shared/disburse-debt/SharedDisburseDebtList.tsx"), /\/api\/admin\/disburse-debt/);
});
