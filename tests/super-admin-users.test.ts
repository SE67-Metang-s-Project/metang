import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { isCmuEmail, isNameTooLong, MAX_NAME_LENGTH } from "../lib/role-management";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

const queries = read("db/queries/users.ts");
const idRoute = read("app/api/super-admin/users/[id]/route.ts");
const listRoute = read("app/api/super-admin/users/route.ts");
const fn = (name: string) => {
  const start = queries.indexOf(`export async function ${name}`);
  const next = queries.indexOf("\nexport ", start + 1);
  return queries.slice(start, next === -1 ? undefined : next);
};

test("isCmuEmail accepts addresses at cmu.ac.th only", () => {
  for (const ok of ["a@cmu.ac.th", "A.B@CMU.AC.TH", " a@cmu.ac.th "]) {
    assert.equal(isCmuEmail(ok), true, ok);
  }
  for (const bad of [
    "a@gmail.com",
    "a@nurse.cmu.ac.th",
    "a@evilcmu.ac.th",
    "a@cmu.ac.th.evil.com",
    "a@cmu.ac.thx",
    "a@cmu.ac.th@evil.com",
    "a@",
    "no-at",
  ]) {
    assert.equal(isCmuEmail(bad), false, bad);
  }
});

test("adding and editing a user both require a CMU address", () => {
  assert.match(listRoute, /if \(!isCmuEmail\(email\)\)/);
  assert.match(idRoute, /if \(!isCmuEmail\(email\)\)/);
});

test("isNameTooLong caps either name at MAX_NAME_LENGTH after trimming", () => {
  const max = "ก".repeat(MAX_NAME_LENGTH);
  assert.equal(isNameTooLong(max, null), false);
  assert.equal(isNameTooLong(`  ${max}  `, undefined), false);
  assert.equal(isNameTooLong(`${max}ก`, null), true);
  assert.equal(isNameTooLong("ชื่อ", "a".repeat(MAX_NAME_LENGTH + 1)), true);
  assert.equal(isNameTooLong("ชื่อ", 123), false);
});

test("adding and editing a user both cap the name length", () => {
  assert.match(listRoute, /if \(isNameTooLong\(fullNameTh, fullNameEn\)\)/);
  assert.match(idRoute, /if \(isNameTooLong\(fullNameTh, fullNameEn\)\)/);
});

test("the delete route runs the same-origin check before anything else", () => {
  const del = idRoute.slice(
    idRoute.indexOf("export async function DELETE"),
    idRoute.indexOf("export async function PATCH"),
  );
  assert.ok(del.indexOf("isSameOrigin(request)") > -1);
  assert.ok(del.indexOf("isSameOrigin(request)") < del.indexOf("getSuperAdminAccess()"));
  assert.match(del, /SELF_DEMOTION/);
});

test("deleting a user deletes the row only when nothing still names them", () => {
  const del = fn("deleteManagedUser");
  // Every NoAction FK to app_user is counted before the delete, so a loan, approval, payment or
  // ledger row keeps the row (roles only) instead of making PostgreSQL abort the transaction.
  for (const check of [
    /remainingRoles\.length > 0/,
    /tx\.loanRequest\.count\(\{\s*where: \{ OR: \[\{ advisorId: targetUserId \}, \{ assignedAdminId: targetUserId \}\] \}/,
    /tx\.loanApproval\.count\(\{ where: \{ decidedBy: targetUserId \} \}\)/,
    /tx\.payment\.count\(\{ where: \{ confirmedBy: targetUserId \} \}\)/,
    /tx\.fundTransaction\.count\(\{ where: \{ performedBy: targetUserId \} \}\)/,
  ]) {
    assert.match(del, check);
  }
  assert.match(del, /if \(named\) \{\s*await tx\.userRole\.deleteMany\([\s\S]*\} else \{\s*[^\n]*\n\s*await tx\.appUser\.delete\(\{ where: \{ id: targetUserId \} \}\);/);
  assert.match(del, /after: \{ roles: remainingRoles, rowDeleted: !named \}/);
  assert.doesNotMatch(del, /SAVEPOINT/);
  // Loans move before the count, so open loans never keep a removed admin's row.
  assert.ok(del.indexOf("reassignOpenAdminLoans(tx,") < del.indexOf("const named"));
  assert.match(del, /if \(targetUserId === actorId\) throw new RoleMutationError\("SELF_DEMOTION"\)/);
});

test("every NoAction FK to app_user is one the delete counts", () => {
  // A new FK to app_user must be counted in deleteManagedUser (or be Cascade / SetNull).
  const schema = read("db/schema.prisma");
  const noAction = [...schema.matchAll(/AppUser\??\s+@relation\([^)]*fields: \[(\w+)\], references: \[id\], onDelete: NoAction/g)].map((m) => m[1]);
  assert.deepEqual(noAction.sort(), ["advisorId", "assignedAdminId", "confirmedBy", "decidedBy", "performedBy"]);
});

test("adding a user refuses anyone holding a role, rehires a removed one, and never renames", () => {
  const create = fn("createManagedUser");
  assert.match(create, /OR: \[\{ email: cleanEmail \}, \{ cmuAccount \}\]/);
  assert.match(create, /if \(existing && existing\.roles\.length > 0\) throw new RoleMutationError\("EMAIL_ALREADY_IN_USE"\);/);
  // A kept row with no roles gets the role back on the same id; names are never written.
  assert.match(create, /if \(existing\) \{\s*await tx\.userRole\.create\(\{ data: \{ userId: existing\.id, role, grantedBy: actorId \} \}\);/);
  assert.match(create, /after: \{ roles: \[role\], rehired: true \}/);
  assert.doesNotMatch(create, /appUser\.update\(/);
  assert.match(fn("editExecutive"), /OR: \[\{ email: cleanEmail \}, \{ cmuAccount \}\]/);
});

test("a duplicate-email race on add gets the email-taken message", () => {
  assert.match(
    listRoute,
    /if \(isUniqueConstraintOnField\(error, "email"\) \|\| isUniqueConstraintOnField\(error, "cmu_account"\)\) \{\s*return apiError\("CONFLICT", "อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409\);/,
  );
  // Checked before the generic P2002 retry message.
  assert.ok(listRoute.indexOf("isUniqueConstraintOnField(error") < listRoute.indexOf('error.code === "P2002"'));
});

test("an advisor is never also admin or super_admin, either way round", () => {
  assert.match(
    fn("mutateUserRole"),
    /if \(\(role === "advisor" && beforeRoles\.some\(staffRole\)\) \|\| \(staffRole\(role\) && beforeRoles\.includes\("advisor"\)\)\) \{\s*throw new RoleMutationError\("ADVISOR_ADMIN_CONFLICT"\);/,
  );
  assert.match(read("app/api/super-admin/users/[id]/roles/route.ts"), /"ADVISOR_ADMIN_CONFLICT",\s*"An advisor cannot also be an admin or SuperAdmin",\s*409/);
});

test("every staff mutation re-checks the caller is still a SuperAdmin inside its transaction", () => {
  // The route's access check runs before the transaction; the role (or, now, the whole row) can go
  // in between, and audit_log.actor_id has no FK to catch a deleted actor.
  for (const name of ["mutateUserRole", "createManagedUser", "deleteManagedUser", "editExecutive"]) {
    assert.match(
      fn(name),
      /return prisma\.\$transaction\(async \(tx\) => \{\s*await assertActorIsSuperAdmin\(tx, actorId\);/,
      name,
    );
  }
  const rolesRoute = read("app/api/super-admin/users/[id]/roles/route.ts");
  for (const [file, count] of [[listRoute, 1], [idRoute, 2], [rolesRoute, 1]] as const) {
    assert.equal(file.match(/"ACCESS_REVOKED"/g)?.length, count);
  }
});

test("removing the advisor role cancels that advisor's pending_advisor loans", () => {
  assert.match(fn("mutateUserRole"), /if \(role === "advisor"\) await cancelOpenAdvisorLoans\(tx, \{ actorId, targetUserId \}\);/);
  const cancel = queries.slice(queries.indexOf("async function cancelOpenAdvisorLoans"), queries.indexOf("export async function mutateUserRole"));
  // Only pending_advisor: later steps never send a loan back to the advisor. CAS on the status.
  assert.match(cancel, /const where = \{ advisorId: targetUserId, status: "pending_advisor" as LoanStatus \};/);
  assert.match(cancel, /if \(cancelled\.count !== openLoans\.length\) throw new RoleMutationError\("REASSIGNMENT_CONFLICT"\);/);
  // The pending advisor approval is closed, or loan_approval's CHECK and one-pending index break.
  assert.match(cancel, /step: "advisor", decision: "pending"/);
  assert.match(cancel, /decision: "rejected", decidedBy: actorId, decidedAt: cancelledAt/);
  assert.match(cancel, /action: "loan_request\.cancelled"/);
});
