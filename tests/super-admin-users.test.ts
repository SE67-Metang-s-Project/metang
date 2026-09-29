import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { isCmuEmail } from "../lib/role-management";

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

test("the delete route runs the same-origin check before anything else", () => {
  const del = idRoute.slice(
    idRoute.indexOf("export async function DELETE"),
    idRoute.indexOf("export async function PATCH"),
  );
  assert.ok(del.indexOf("isSameOrigin(request)") > -1);
  assert.ok(del.indexOf("isSameOrigin(request)") < del.indexOf("getSuperAdminAccess()"));
  assert.match(del, /SELF_DEMOTION/);
});

test("deleting a user keeps the row, so history never aborts the transaction", () => {
  const del = fn("deleteManagedUser");
  // The row is never deleted: only the roles go, so an audit_log or loan_approval reference cannot
  // make PostgreSQL abort the transaction (25P02), and past decisions keep their name.
  assert.doesNotMatch(del, /appUser\.delete\(/);
  assert.doesNotMatch(del, /SAVEPOINT/);
  // The removed admin's open loans move to the SuperAdmin who removed them.
  assert.match(del, /reassignOpenAdminLoans\(tx,/);
  assert.match(del, /if \(targetUserId === actorId\) throw new RoleMutationError\("SELF_DEMOTION"\)/);
});

test("adding a user records the old names, and editing checks cmuAccount as well as email", () => {
  assert.match(
    fn("createManagedUser"),
    /before: \{ fullNameTh: existing\.fullNameTh, fullNameEn: existing\.fullNameEn \}/,
  );
  assert.match(fn("editExecutive"), /OR: \[\{ email: cleanEmail \}, \{ cmuAccount \}\]/);
});
