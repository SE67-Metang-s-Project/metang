import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const query = read("db/queries/loan-requests.ts");
const pendingTotalFn = query.slice(query.indexOf("export async function getPendingDisbursementTotal"));
const route = read("app/api/super-admin/fund-transactions/route.ts");
const tab = read("components/superadmin/setting/SystemBudgetTab.tsx");

test("getPendingDisbursementTotal aggregates by pending_disbursement status, system-wide", () => {
  assert.match(pendingTotalFn, /where: \{ status: "pending_disbursement" \}/);
  assert.match(pendingTotalFn, /_sum: \{ approvedAmount: true \}/);
  assert.match(pendingTotalFn, /result\._sum\.approvedAmount \?\? 0/);

  // System-wide SuperAdmin total, unlike the Admin-scoped queue elsewhere in this file -
  // must not filter by assignedAdminId.
  const body = pendingTotalFn.slice(0, pendingTotalFn.indexOf("\n}"));
  assert.doesNotMatch(body, /assignedAdminId/);
});

test("fund-transactions route imports getPendingDisbursementTotal from loan-requests queries", () => {
  assert.match(
    route,
    /import \{ getPendingDisbursementTotal \} from "@\/db\/queries\/loan-requests";/,
  );
});

test("fund-transactions GET fetches balance, transactions, and pendingDisbursement together", () => {
  const getHandler = route.slice(route.indexOf("export async function GET"));
  const promiseAll = getHandler.slice(
    getHandler.indexOf("Promise.all(["),
    getHandler.indexOf("]);", getHandler.indexOf("Promise.all([")) + "]);".length,
  );
  assert.match(promiseAll, /getFundBalance\(\)/);
  assert.match(promiseAll, /listFundTransactions\(\)/);
  assert.match(promiseAll, /getPendingDisbursementTotal\(\)/);
});

test("fund-transactions GET returns pendingDisbursement alongside balance and transactions", () => {
  const getHandler = route.slice(route.indexOf("export async function GET"));
  assert.match(
    getHandler,
    /apiOk\(serializeJson\(\{ balance, transactions, pendingDisbursement \}\)\)/,
  );
});

test("fund-transactions GET still checks auth before querying (regression guard)", () => {
  const getHandler = route.slice(
    route.indexOf("export async function GET"),
    route.indexOf("Promise.all(["),
  );
  assert.match(getHandler, /access\.status === "unauthenticated"/);
  assert.match(getHandler, /apiError\("UNAUTHORIZED", "Authentication required", 401\)/);
  assert.match(getHandler, /access\.status === "forbidden"/);
  assert.match(getHandler, /apiError\("FORBIDDEN", "SuperAdmin access required", 403\)/);
});

test("SystemBudgetTab Save button is disabled when the budget-amount input is cleared (regression guard)", () => {
  // A cleared input ("") must not be treated as target 0 and enable a debit_adjustment that
  // wipes the whole fund - both the button's disabled check and handleSave itself must guard it.
  const saveButton = tab.slice(tab.indexOf("onClick={handleSave}"), tab.indexOf("</button>", tab.indexOf("onClick={handleSave}")));
  assert.match(saveButton, /budgetAmount === ""/);

  const handleSave = tab.slice(tab.indexOf("const handleSave = async"), tab.indexOf("const usagePercentage"));
  assert.match(handleSave, /if \(budgetAmount === ""\) return;/);
});
