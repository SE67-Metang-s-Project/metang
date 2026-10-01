import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

// Every role path is guarded by its own role's access function, and by no other role's. The
// actor x role outcomes of those functions live in tests/db/role-access-matrix.test.ts.

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const filesNamed = (dir, name) =>
  readdirSync(resolve(root, dir), { recursive: true })
    .filter((file) => file === name || file.endsWith(`/${name}`))
    .map((file) => `${dir}/${file}`)
    .sort();

const GATES = {
  student: ["requireStudentAccess", "getStudentAccess", "getStudentContext", "getStudentSessionContext"],
  advisor: ["requireAdvisorAccess", "getAdvisorAccess", "getAdvisorContext"],
  admin: ["requireAdminAccess", "getAdminAccess", "getAdminContext"],
  super_admin: ["requireSuperAdminAccess", "getSuperAdminAccess"],
  executive: ["requireExecutiveAccess", "getExecutiveAccess", "getExecutiveContext"],
};
const calls = (source, name) => new RegExp(`\\b${name}\\(`).test(source);
const otherGates = (role) =>
  Object.entries(GATES).flatMap(([other, names]) => (other === role ? [] : names));

const STAFF_LAYOUTS = {
  "app/admin/layout.tsx": ["admin", "requireAdminAccess"],
  "app/advisor/layout.tsx": ["advisor", "requireAdvisorAccess"],
  "app/executive/layout.tsx": ["executive", "requireExecutiveAccess"],
  "app/superadmin/layout.tsx": ["super_admin", "requireSuperAdminAccess"],
};

for (const [layout, [role, guard]] of Object.entries(STAFF_LAYOUTS)) {
  test(`${layout} guards every page under it with ${guard} only`, () => {
    const source = read(layout);
    assert.match(source, new RegExp(`const context = await ${guard}\\(\\);`));
    for (const other of otherGates(role)) assert.ok(!calls(source, other), `${layout} calls ${other}`);
  });
}

// The student layout has no guard, so each page carries its own.
test("every app/student page calls requireStudentAccess or re-exports a page that does", () => {
  const pages = filesNamed("app/student", "page.tsx");
  assert.ok(pages.length > 0);

  for (const page of pages) {
    const source = read(page);
    const reexport = source.match(/^import (\w+) from "@\/(app\/student\/[\w/]*page)";[\s\S]*export default \1;/m);
    const target = reexport ? `${reexport[2]}.tsx` : page;
    assert.match(read(target), /await requireStudentAccess\(\)/, `${page} has no student guard`);
    for (const other of otherGates("student")) assert.ok(!calls(source, other), `${page} calls ${other}`);
  }
});

const API_ROLES = {
  "app/api/admin": "admin",
  "app/api/advisor": "advisor",
  "app/api/executive": "executive",
  "app/api/student": "student",
  "app/api/super-admin": "super_admin",
  "app/api/superadmin": "super_admin",
};
const HANDLER = /^export async function (GET|POST|PUT|PATCH|DELETE)\b/m;

for (const [dir, role] of Object.entries(API_ROLES)) {
  test(`every handler under ${dir} checks the ${role} role and no other`, () => {
    const routes = filesNamed(dir, "route.ts");
    assert.ok(routes.length > 0);

    for (const route of routes) {
      const source = read(route);
      // ponytail: splits on each exported handler; a handler that delegates its guard to a helper
      // further down the file would fail here and need its own pin.
      const handlers = source.split(HANDLER).slice(1);
      assert.ok(handlers.length > 0, `${route} exports no handler`);

      for (let index = 0; index < handlers.length; index += 2) {
        const [method, body] = [handlers[index], handlers[index + 1]];
        assert.ok(
          GATES[role].some((name) => calls(body, name)),
          `${route} ${method} does not check the ${role} role`,
        );
      }
      for (const other of otherGates(role)) assert.ok(!calls(source, other), `${route} calls ${other}`);
    }
  });
}
