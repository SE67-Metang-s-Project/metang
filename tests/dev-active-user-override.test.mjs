import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const devAccess = read("lib/development-access.ts");
const loanAuth = read("lib/loan-auth.ts");

test("getDevelopmentActiveUserId is only honored in the dev environment", () => {
  const fn = devAccess.slice(devAccess.indexOf("export function getDevelopmentActiveUserId"));
  assert.match(fn, /if \(!isDevelopmentEnvironment\(infisicalEnvironment, nodeEnvironment\)\) return undefined;/);
});

test("getDevelopmentActiveUserId trims the raw env value and treats blank as unset", () => {
  const fn = devAccess.slice(devAccess.indexOf("export function getDevelopmentActiveUserId"));
  assert.match(fn, /value\?\.trim\(\)/);
  assert.match(fn, /return trimmed \? trimmed : undefined;/);
});

test("lib/loan-auth.ts imports getDevelopmentActiveUserId from development-access", () => {
  assert.match(
    loanAuth,
    /import \{[\s\S]*?getDevelopmentActiveUserId[\s\S]*?\} from "@\/lib\/development-access";/,
  );
});

test("the role-scoped dev bypass prefers DEV_ACTIVE_USER_ID over the role's own fixed fixture", () => {
  // Lets a fixture holding more than one role (e.g. exec@cmu.ac.th also holding "advisor") be
  // reached through any of its roles' bypass, instead of always resolving to a separate fixed
  // fixture per role.
  assert.match(
    loanAuth,
    /id: getDevelopmentActiveUserId\(\) \?\? DEVELOPMENT_USER_IDS\[developmentRole\],/,
  );
});

test("the student dev bypass also honors the same override", () => {
  assert.match(
    loanAuth,
    /id: getDevelopmentActiveUserId\(\) \?\? DEVELOPMENT_STUDENT_ID \},/,
  );
});

test("the override does not skip role verification - getDevelopmentLoanContext still checks the resolved user actually holds the requested role (regression guard)", () => {
  const fn = loanAuth.slice(
    loanAuth.indexOf("async function getDevelopmentLoanContext"),
    loanAuth.indexOf("export type RoleAccess"),
  );
  assert.match(fn, /const hasRequestedRole =/);
  assert.match(fn, /if \(!hasRequestedRole\) return null;/);
});

test("the override does not skip role verification - getDevelopmentStudentContext still checks studentCode and the student role (regression guard)", () => {
  const fn = loanAuth.slice(
    loanAuth.indexOf("async function getDevelopmentStudentContext"),
    loanAuth.indexOf("async function getDevelopmentStudentContext") + 600,
  );
  assert.match(
    fn,
    /if \(!user \|\| !user\.studentCode \|\| !user\.roles\.some\(\(\{ role \}\) => role === "student"\)\) return null;/,
  );
});
