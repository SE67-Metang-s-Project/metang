import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("SuperAdmin settings route is guarded by getSuperAdminAccess with 401/403 and JSON validation", () => {
  const source = read("app/api/super-admin/settings/route.ts");
  assert.match(source, /import \{ validateJsonRequest \} from "@\/lib\/request-security";/);
  assert.match(source, /await getSuperAdminAccess\(\)/);
  assert.match(source, /"unauthenticated"[\s\S]*?401/);
  assert.match(source, /"forbidden"[\s\S]*?403/);
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
});

test("updateSystemSetting re-checks the super_admin role inside the transaction and writes an audit log", () => {
  const source = read("db/queries/system-settings.ts");
  const fnStart = source.indexOf("export async function updateSystemSetting");
  assert.ok(fnStart > -1);
  const fn = source.slice(fnStart);

  assert.match(fn, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(fn, /role: "super_admin"/);
  assert.match(fn, /throw new SystemSettingError\("ACCESS_REVOKED"\)/);
  assert.match(fn, /await tx\.auditLog\.create\(/);
  assert.match(fn, /action: "system_setting\.updated"/);
});

test("systemSettingPublicSelect exposes no editor identity or timestamps", () => {
  const source = read("db/queries/system-settings.ts");
  const selectStart = source.indexOf("export const systemSettingPublicSelect");
  const selectEnd = source.indexOf("satisfies Prisma.SystemSettingSelect", selectStart);
  const select = source.slice(selectStart, selectEnd);

  assert.doesNotMatch(select, /updatedById/);
  assert.doesNotMatch(select, /updatedAt/);
  assert.doesNotMatch(select, /createdAt/);
});

test("the everyone-facing settings route is read-only and role-agnostic", () => {
  const source = read("app/api/system-settings/route.ts");
  assert.match(source, /await getSignedInContext\(\)/);
  assert.doesNotMatch(source, /getStudentAccess/);
  assert.doesNotMatch(source, /getSuperAdminAccess/);
  assert.match(source, /export async function GET/);
  assert.doesNotMatch(source, /export async function POST/);
});

test("public/openapi.json documents both settings endpoints", () => {
  const spec = JSON.parse(read("public/openapi.json"));
  assert.ok(spec.paths["/super-admin/settings"], "missing /super-admin/settings");
  assert.ok(spec.paths["/super-admin/settings"].get, "missing GET /super-admin/settings");
  assert.ok(spec.paths["/super-admin/settings"].post, "missing POST /super-admin/settings");
  assert.ok(spec.paths["/system-settings"], "missing /system-settings");
  assert.ok(spec.paths["/system-settings"].get, "missing GET /system-settings");
  assert.strictEqual(
    spec.paths["/system-settings"].post,
    undefined,
    "/system-settings must not expose POST",
  );
});
