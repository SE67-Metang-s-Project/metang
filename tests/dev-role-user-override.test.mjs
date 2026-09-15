import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const devAccess = read("lib/development-access.ts");
const loanAuth = read("lib/loan-auth.ts");

test("each dev role maps to its own override env var, not a shared one", () => {
  const map = devAccess.slice(
    devAccess.indexOf("const developmentRoleUserIdEnvironmentVariables"),
    devAccess.indexOf("export function getDevelopmentRoleUserId"),
  );
  assert.match(map, /advisor: "DEV_ADVISOR_USER_ID"/);
  assert.match(map, /admin: "DEV_ADMIN_USER_ID"/);
  assert.match(map, /super_admin: "DEV_SUPERADMIN_USER_ID"/);
  assert.match(map, /executive: "DEV_EXECUTIVE_USER_ID"/);
});

test("getDevelopmentRoleUserId is only honored in the dev environment", () => {
  const fn = devAccess.slice(devAccess.indexOf("export function getDevelopmentRoleUserId"));
  assert.match(fn, /if \(!isDevelopmentEnvironment\(infisicalEnvironment, nodeEnvironment\)\) return undefined;/);
});

test("getDevelopmentRoleUserId trims the raw env value and treats blank as unset", () => {
  const fn = devAccess.slice(devAccess.indexOf("export function getDevelopmentRoleUserId"));
  assert.match(fn, /value\?\.trim\(\)/);
  assert.match(fn, /return trimmed \? trimmed : undefined;/);
});

test("lib/loan-auth.ts imports getDevelopmentRoleUserId from development-access", () => {
  assert.match(
    loanAuth,
    /import \{[\s\S]*?getDevelopmentRoleUserId[\s\S]*?\} from "@\/lib\/development-access";/,
  );
});

test("the role-scoped dev bypass prefers the per-role override over its own fixed fixture", () => {
  assert.match(
    loanAuth,
    /id: getDevelopmentRoleUserId\(developmentRole\) \?\? DEVELOPMENT_USER_IDS\[developmentRole\],/,
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

test("the student dev bypass is untouched by the per-role override (student has no role-specific env var)", () => {
  const fn = loanAuth.slice(
    loanAuth.indexOf("async function getDevelopmentStudentContext"),
    loanAuth.indexOf("async function getDevelopmentLoanContext"),
  );
  assert.match(fn, /id: DEVELOPMENT_STUDENT_ID \},/);
  assert.doesNotMatch(fn, /getDevelopmentRoleUserId/);
});
