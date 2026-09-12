import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const query = read("db/queries/loan-requests.ts");
const disburseService = query.slice(query.indexOf("export async function disburseLoanRequest"));
const route = read("app/api/admin/loan-requests/[id]/disburse/route.ts");
const auth = read("lib/loan-auth.ts");
const queueRoute = read("app/api/admin/loan-requests/route.ts");
const detailRoute = read("app/api/admin/loan-requests/[id]/route.ts");

test("disbursement is wrapped in a transaction and every write uses the tx client", () => {
  assert.match(disburseService, /return prisma\.\$transaction\(async \(tx\) => \{/);

  // Every mutating call inside the service body must go through `tx`, never the bare
  // `prisma` client - a stray `prisma.` call would silently escape the transaction and
  // defeat rollback on any later failure in the same request.
  const body = disburseService.slice(
    disburseService.indexOf("prisma.$transaction"),
    disburseService.indexOf("return final;") + "return final;".length,
  );
  for (const call of [
    "tx.userRole.findFirst",
    "tx.loanRequest.findFirst",
    "tx.fundTransaction.create",
    "tx.loanRequest.updateMany",
    "tx.installment.createMany",
    "tx.loanRequest.findUniqueOrThrow",
    "tx.auditLog.create",
  ]) {
    assert.match(body, new RegExp(call.replace(".", "\\.")));
  }
  assert.doesNotMatch(body, /[^x]\bprisma\.(loanRequest|fundTransaction|installment|auditLog|userRole)\./);
});

test("authorization: only admin/super_admin can disburse, route maps unauthenticated/forbidden", () => {
  assert.match(
    disburseService,
    /tx\.userRole\.findFirst\(\{\s*where: \{ userId: adminId, role: \{ in: \["admin", "super_admin"\] \} \}/,
  );
  assert.match(disburseService, /if \(!effectiveRole\) throw new DisbursementError\("ACCESS_REVOKED"\);/);

  assert.match(route, /const access = await getAdminAccess\(\);/);
  assert.match(route, /access\.status === "unauthenticated"/);
  assert.match(route, /return apiError\("UNAUTHORIZED", "Authentication required", 401\);/);
  assert.match(route, /access\.status === "forbidden"/);
  assert.match(route, /return apiError\("FORBIDDEN", "Admin access required", 403\);/);
});

test("duplicate prevention: unique-violation on the disbursement row maps to 409", () => {
  assert.match(
    disburseService,
    /error instanceof Prisma\.PrismaClientKnownRequestError && error\.code === "P2002"/,
  );
  assert.match(disburseService, /throw new DisbursementError\("DUPLICATE_DISBURSEMENT"\);/);

  assert.match(route, /error\.code === "DUPLICATE_DISBURSEMENT"/);
  assert.match(route, /return apiError\("CONFLICT", "The loan was already disbursed", 409\);/);
  // Belt-and-suspenders: a raw Prisma unique/serialization error on the same route also 409s.
  assert.match(route, /\["P2002", "P2034"\]\.includes\(error\.code\)/);
});

test("insufficient funds: the balance-guard trigger message maps to 409, coupled to the migration", () => {
  assert.match(disburseService, /error\.message\.includes\("fund_transaction: insufficient balance"\)/);
  assert.match(disburseService, /if \(insufficientFunds\) throw new DisbursementError\("INSUFFICIENT_FUNDS"\);/);

  assert.match(route, /error\.code === "INSUFFICIENT_FUNDS"/);
  assert.match(route, /"Insufficient fund balance for this disbursement"/);

  // The service's catch string must literally match what the DB trigger raises, or the
  // guard silently stops firing. fund-ledger-invariants.migration.test.mjs asserts the
  // trigger side of this same string.
  const migration = read("db/migrations/20260911120000_fund_ledger_invariants/migration.sql");
  assert.match(migration, /fund_transaction: insufficient balance/);
});

test("stale state: the loan must still be pending_disbursement at update time", () => {
  assert.match(
    disburseService,
    /const current = await tx\.loanRequest\.findFirst\(\{\s*where: \{ id, status: "pending_disbursement" \}/,
  );
  assert.match(
    disburseService,
    /const changed = await tx\.loanRequest\.updateMany\(\{\s*where: \{ id, status: "pending_disbursement" \}/,
  );
  assert.match(disburseService, /if \(changed\.count !== 1\) throw new DisbursementError\("STALE_DECISION"\);/);

  assert.match(route, /error\.code === "STALE_DECISION"/);
  assert.match(route, /"The loan is no longer awaiting disbursement"/);
});

test("concurrency: CAS update and the unique disbursement index guard the same race together", () => {
  // Two independent racers must both be in place: the status-scoped updateMany (CAS) and
  // the DB-level unique index on (loan_id) for kind='disbursement' (caught as P2002 above).
  assert.match(disburseService, /status: "pending_disbursement"/);
  assert.match(disburseService, /error\.code === "P2002"/);

  const migration = read("db/migrations/20260911120000_fund_ledger_invariants/migration.sql");
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "fund_transaction_one_disbursement_per_loan"\s+ON "public"\.\"fund_transaction"\("loan_id"\)\s+WHERE "kind" = 'disbursement';/,
  );

  // The slip is uploaded to storage before the transaction opens - a deliberate tradeoff
  // (orphaned object on failure, but no giant object held across a DB transaction).
  const uploadIndex = route.indexOf("await uploadSlip(");
  const disburseCallIndex = route.indexOf("disburseLoanRequest({");
  assert.ok(uploadIndex > -1 && disburseCallIndex > -1 && uploadIndex < disburseCallIndex);
});

test("cancel guard: disbursed loans are excluded from cancellation everywhere", () => {
  const cancelRoute = read("app/api/student/loan-requests/[id]/cancel/route.ts");
  assert.match(cancelRoute, /const terminalStatuses: LoanStatus\[\] = \[[^\]]*"disbursed"[^\]]*\];/);

  const loanDetailsPage = read("components/student/loan-details/LoanDetailsPage.tsx");
  assert.match(
    loanDetailsPage,
    /canCancelRequest = !\[[^\]]*"disbursed"[^\]]*\]\.includes\(\s*details\.statusCode/,
  );

  const dashboard = read("components/student/dashboard/StudentDashboard.tsx");
  assert.match(dashboard, /showCancelRequest=\{Boolean\(\s*currentActiveLoan && !\("isDisbursed" in currentActiveLoan && currentActiveLoan\.isDisbursed\)/);
});

test("NAT-162: pending_disbursement is a shared queue, not owned by one admin", () => {
  // The single line the whole "Admin and SuperAdmin" half of the ticket rests on.
  assert.match(
    auth,
    /function hasAdminRole\(roles: \{ role: UserRoleName \}\[\]\) \{\s*return roles\.some\(\(\{ role \}\) => role === "admin" \|\| role === "super_admin"\);/,
  );

  // Queue: pending_disbursement branch must be a bare object with no ownership filter -
  // it's a shared post-approval action, not owned by one admin. The exact-literal match
  // itself proves no assignedAdminId sits inside that object.
  assert.match(queueRoute, /\{ status: "pending_disbursement" as const \}/);

  // Queue: pending_admin branch DOES keep the ownership filter.
  assert.match(
    queueRoute,
    /status: "pending_admin" as const,\s*OR: \[\{ assignedAdminId: null \}, \{ assignedAdminId: access\.context\.user\.id \}\]/,
  );

  // Detail: the OR array's pending_disbursement entry is bare (no assignedAdminId attached),
  // alongside the two ownership-scoped pending_admin entries.
  assert.match(detailRoute, /\{ status: "pending_admin", assignedAdminId: null \}/);
  assert.match(
    detailRoute,
    /\{ status: "pending_admin", assignedAdminId: access\.context\.user\.id \}/,
  );
  assert.match(detailRoute, /\{ status: "pending_disbursement" \}/);

  // Validator must actually accept the value the routes branch on, or it's dead code.
  const validation = read("lib/loan-validation.ts");
  assert.match(validation, /if \(value === "pending_disbursement"\) return "pending_disbursement";/);
});
