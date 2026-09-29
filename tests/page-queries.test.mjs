import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const read = (file) => readFileSync(resolve(import.meta.dirname, "..", file), "utf8");
const queries = read("db/queries/loan-requests.ts");

const fnBody = (name) => {
  const fn = queries.slice(queries.indexOf(`export async function ${name}`));
  return fn.slice(0, fn.indexOf("\n}\n"));
};

// Server pages serialize whatever their query returns into the HTML, so each page calls a query
// scoped to what its UI shows.
test("each staff page imports its own query", () => {
  const pages = {
    "app/admin/page.tsx": "getAdminDashboardRequests",
    // EXPERIMENT server-paging: the queue, verify-slip and disburse pages get one page at a time
    "app/admin/pending/page.tsx": "getAdminQueuePage",
    "app/superadmin/pending/page.tsx": "getAdminQueuePage",
    "app/executive/pending-executive/page.tsx": "getExecutiveQueuePage",
    "app/advisor/pending/page.tsx": "getAdvisorQueuePage",
    "app/executive/pending-advisor/page.tsx": "getAdvisorQueuePage",
    "app/advisor/students/page.tsx": "getStudentsPage",
    "app/executive/students/page.tsx": "getStudentsPage",
    "app/admin/disburse-debt/page.tsx": "getDisbursementPage",
    "app/superadmin/disburse-debt/page.tsx": "getDisbursementPage",
    "app/admin/verify-slip/page.tsx": "getVerifySlipPage",
    // EXPERIMENT verify-slip-paging: SuperAdmin gets one page at a time
    "app/superadmin/verify-slip/page.tsx": "getVerifySlipPage",
    "app/advisor/page.tsx": "getAdvisorDashboardRequests",
    "app/superadmin/settings/page.tsx": "listStaffWithRoles",
  };
  for (const [file, fn] of Object.entries(pages)) {
    assert.match(read(file), new RegExp(`import \\{ ${fn} \\} from`), file);
  }
});

test("no staff query returns drafts", () => {
  for (const name of ["getAdminQueueRequests", "getAdvisorActionRequests", "getExecutiveActionRequests"]) {
    assert.match(fnBody(name), /status: \{ not: "draft" \}/, name);
  }
  for (const name of ["getAdvisorStudentRequests", "getExecutiveStudentRequests"]) {
    assert.match(fnBody(name), /status: "disbursed"/, name);
  }
});

test("verify-slip reads payments only, without the bank account or conduct", () => {
  const view = queries.slice(queries.indexOf("const verifySlipView"), queries.indexOf("const verifySlipWhere"));
  assert.match(view, /bank: false/);
  assert.match(view, /conduct: false/);
  assert.match(view, /verifySlip: true/);
  const where = queries.slice(queries.indexOf("const verifySlipWhere"));
  assert.match(
    where.slice(0, where.indexOf("};")),
    /status: \{ in: \["disbursed", "closed"\] \},\s*payments: \{ some: \{\} \}/,
  );
  assert.match(fnBody("getVerifySlipRequests"), /loadActionRequests\(verifySlipWhere, verifySlipView\)/);
});

test("the loader skips advisor, approvals and disbursement joins for verify-slip", () => {
  const loader = queries.slice(queries.indexOf("async function loadActionRequests"));
  const body = loader.slice(0, loader.indexOf("\n}\n"));
  assert.match(body, /view\.verifySlip\s*\?\s*\{\}/);
  assert.match(body, /view\.slipLinks && !view\.verifySlip/);
});

// These pages load every loan that can have installments, so conduct comes from the rows they
// already read instead of a second read of every student's history.
test("all-status pages compute conduct from the loaded rows", () => {
  for (const name of ["getAdminQueueRequests", "getExecutiveActionRequests", "getDisbursementActionRequests"]) {
    assert.match(fnBody(name), /conductFromRows: true/, name);
  }
  for (const name of ["getAdminDashboardRequests", "getAdvisorDashboardRequests", "getAdvisorActionRequests"]) {
    assert.doesNotMatch(fnBody(name), /conductFromRows: true/, `${name} filters loans, so it must query`);
  }
});

test("advisor views get neither the bank account nor slip links", () => {
  assert.match(queries, /const advisorView: ActionRequestView = \{ bank: false, slipLinks: false,/);
  for (const name of ["getAdvisorDashboardRequests", "getAdvisorActionRequests", "getAdvisorStudentRequests"]) {
    assert.match(fnBody(name), /advisorView/, name);
  }
});

test("the loader selects bank columns and slip ids only when the view asks", () => {
  const loader = queries.slice(queries.indexOf("async function loadActionRequests"));
  const body = loader.slice(0, loader.indexOf("\n}\n"));
  assert.match(body, /view\.bank \? \{ bankName: true/);
  assert.match(body, /view\.slipLinks/);
  assert.match(body, /view\.schedule/);
  assert.doesNotMatch(body, /studentLoans: \{\s*select/, "the old per-row include of every student loan");
});

test("the settings page lists only staff", () => {
  const users = read("db/queries/users.ts");
  const fn = users.slice(users.indexOf("export async function listStaffWithRoles"));
  assert.match(
    fn.slice(0, fn.indexOf("\n}\n")),
    /roles: \{ some: \{ role: \{ in: \["admin", "super_admin", "executive"\] \} \} \}/,
  );
});
