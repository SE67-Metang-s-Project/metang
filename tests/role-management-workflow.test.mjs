import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

function responseRef(document, path, method, status = "200") {
  return document.paths?.[path]?.[method]?.responses?.[status]?.content?.["application/json"]?.schema?.$ref;
}

test("role-management access requires super_admin rather than ordinary admin", () => {
  const auth = read("lib/loan-auth.ts");
  assert.match(auth, /function hasSuperAdminRole/);
  assert.match(auth, /role === "super_admin"/);
  assert.match(auth, /getSuperAdminAccess/);
});

test("SuperAdmin user reads expose identity and role grant metadata in stable order", () => {
  const users = read("db/queries/users.ts");
  assert.match(users, /export const superAdminUserSelect/);
  assert.match(users, /roles:[\s\S]*orderBy:[\s\S]*role: "asc"/);
  assert.match(users, /export async function listUsersWithRoles/);
  assert.match(users, /fullNameTh: "asc"/);
  assert.match(users, /id: "asc"/);
});

test("role mutations are serializable, audited, and protect the final SuperAdmin", () => {
  const users = read("db/queries/users.ts");
  const mutation = users.slice(users.indexOf("export type RoleMutationErrorCode"));
  assert.match(mutation, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(mutation, /TransactionIsolationLevel\.Serializable/);
  assert.match(mutation, /role: "super_admin"/);
  assert.match(mutation, /FINAL_SUPER_ADMIN/);
  assert.match(mutation, /tx\.userRole\.(create|delete)/);
  assert.match(mutation, /tx\.auditLog\.create/);
  assert.match(mutation, /user_role\.granted/);
  assert.match(mutation, /user_role\.removed/);
});

test("role-management API types declare users, role mutations, and responses", () => {
  const types = read("lib/loan-api-types.ts");
  for (const name of [
    "UserIdParams",
    "RoleMutationBody",
    "SuperAdminUser",
    "SuperAdminUserListResponse",
    "SuperAdminUserResponse",
  ]) assert.match(types, new RegExp(`export type ${name}`));
});

test("role-management routes enforce SuperAdmin access and mutation safeguards", () => {
  const listRoute = read("app/api/super-admin/users/route.ts");
  for (const symbol of ["getSuperAdminAccess", "listUsersWithRoles", "predefinedRoleNames", "serializeJson"]) {
    assert.match(listRoute, new RegExp(symbol));
  }
  assert.match(listRoute, /Authentication required.*401/s);
  assert.match(listRoute, /SuperAdmin access required.*403/s);

  const mutationRoute = read("app/api/super-admin/users/[id]/roles/route.ts");
  for (const symbol of [
    "validateJsonRequest",
    "getSuperAdminAccess",
    "parseRoleMutationInput",
    "isUuid",
    "mutateUserRole",
    "access.context.user.id",
    "P2002",
    "P2034",
    "FINAL_SUPER_ADMIN",
  ]) assert.match(mutationRoute, new RegExp(symbol));
});

test("OpenAPI publishes the NAT-80 role-management contract", () => {
  const document = JSON.parse(read("public/openapi.json"));
  assert.equal(
    responseRef(document, "/super-admin/users", "get"),
    "#/components/schemas/SuperAdminUserListResponse",
  );
  assert.equal(
    responseRef(document, "/super-admin/users/{id}/roles", "post"),
    "#/components/schemas/SuperAdminUserResponse",
  );
  const body = document.components.schemas.RoleMutationBody;
  assert.deepEqual(body.required?.sort(), ["action", "role"]);
  assert.deepEqual(body.properties.action.enum, ["grant", "remove"]);
  assert.deepEqual(body.properties.role.enum, [
    "student",
    "advisor",
    "admin",
    "super_admin",
    "executive",
  ]);
  for (const [path, method, statuses] of [
    ["/super-admin/users", "get", ["401", "403"]],
    ["/super-admin/users/{id}/roles", "post", ["401", "403", "404", "409", "422"]],
  ]) {
    const operation = document.paths?.[path]?.[method];
    assert.ok(operation?.security?.some((entry) => "cookieAuth" in entry));
    for (const status of statuses) assert.ok(operation?.responses?.[status]);
  }
});
