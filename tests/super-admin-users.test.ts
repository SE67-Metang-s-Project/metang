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
  assert.match(del, /CANNOT_DELETE_SELF/);
});

test("deleting a user with history keeps the row instead of aborting the transaction", () => {
  const del = fn("deleteManagedUser");
  // A failed DELETE aborts a PostgreSQL transaction (25P02): only a savepoint makes the catch safe.
  assert.match(del, /SAVEPOINT delete_app_user/);
  assert.match(del, /ROLLBACK TO SAVEPOINT delete_app_user/);
  assert.match(del, /error\.code !== "P2003"/);
  assert.match(del, /targetUserId === actorId/);
});

test("adding a user records the old names, and editing checks cmuAccount as well as email", () => {
  assert.match(
    fn("createManagedUser"),
    /before: \{ fullNameTh: existing\.fullNameTh, fullNameEn: existing\.fullNameEn \}/,
  );
  assert.match(fn("updateManagedUser"), /OR: \[\{ email: cleanEmail \}, \{ cmuAccount \}\]/);
});
