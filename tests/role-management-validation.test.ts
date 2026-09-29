import assert from "node:assert/strict";
import { test } from "node:test";
import { holdsAdminAccess, parseRoleMutationInput, predefinedRoleNames } from "@/lib/role-management";

test("accepts every predefined grant and remove operation", () => {
  for (const role of predefinedRoleNames) {
    assert.deepEqual(parseRoleMutationInput({ action: "grant", role }), { action: "grant", role });
    assert.deepEqual(parseRoleMutationInput({ action: "remove", role }), { action: "remove", role });
  }
});

test("rejects malformed role mutation bodies", () => {
  for (const value of [
    null,
    [],
    "grant",
    {},
    { action: "replace", role: "admin" },
    { action: "grant", role: "custom" },
    { action: "grant", role: 1 },
  ]) {
    assert.throws(() => parseRoleMutationInput(value), /body|action|role/i);
  }
});

test("admin-step work stays with anyone still holding admin or super_admin", () => {
  assert.equal(holdsAdminAccess(["admin"]), true);
  assert.equal(holdsAdminAccess(["super_admin"]), true);
  assert.equal(holdsAdminAccess(["advisor", "super_admin"]), true);
  // Left with neither, their open loans move to the SuperAdmin who removed them.
  assert.equal(holdsAdminAccess([]), false);
  assert.equal(holdsAdminAccess(["advisor", "executive", "student"]), false);
});

