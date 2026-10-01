import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("UserRolesTab provides adding users, deleting admin/super_admin with 1 super admin minimum guard, and editing executive name/email", () => {
  const content = read("components/superadmin/setting/UserRolesTab.tsx");

  // 1. Add User functionality
  assert.ok(content.includes("เพิ่มผู้ใช้งาน"), "Must include 'เพิ่มผู้ใช้งาน' button/text");
  assert.ok(content.includes("isAddModalOpen"), "Must have add user modal state");
  assert.match(
    content,
    /handleAddUser\s*=\s*async/,
    "Must implement handleAddUser function",
  );
  assert.ok(
    content.includes('withBasePath("/api/super-admin/users")'),
    "Must call POST /api/super-admin/users to add user",
  );

  // 2. Delete Admin and Super Admin with minimum 1 super admin guard
  assert.ok(content.includes("superAdminCount"), "Must calculate superAdminCount to guard deletion");
  assert.ok(content.includes("handleDeleteUser"), "Must implement handleDeleteUser function");
  assert.match(
    content,
    /superAdminCount\s*<=\s*1/,
    "Must check that at least 1 super admin remains",
  );
  assert.ok(
    content.includes("ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบ (Super Admin) อย่างน้อย 1 คนในระบบ") ||
      content.includes("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้"),
    "Must display guard message when attempting to delete the final super admin",
  );
  assert.ok(
    content.includes("userToDelete"),
    "Must have confirmation modal for user deletion",
  );
  assert.ok(
    content.includes('method: "DELETE"'),
    "Must call DELETE method to remove user",
  );

  // 3. Edit Executive name and email
  assert.ok(content.includes("editUser"), "Must have edit modal state for executive");
  assert.ok(content.includes("handleSaveExecutiveEdit"), "Must implement handleSaveExecutiveEdit function");
  assert.ok(content.includes("แก้ไขข้อมูลผู้บริหาร"), "Must have modal for editing executive");
  assert.match(
    content,
    /method:\s*"PATCH"/,
    "Must call PATCH method to update user name/email",
  );
  assert.ok(content.includes("fullNameTh"), "Must allow editing Thai full name");
  assert.ok(content.includes("email"), "Must allow editing email");
});

test("Backend routes and queries enforce super admin guard, role deletion, and executive edit", () => {
  const userQueries = read("db/queries/users.ts");
  const usersRoute = read("app/api/super-admin/users/route.ts");
  const userIdRoute = read("app/api/super-admin/users/[id]/route.ts");
  const deleteFn = userQueries.slice(userQueries.indexOf("export async function deleteManagedUser"));

  // 1. db/queries/users.ts exports the three staff mutations
  assert.match(userQueries, /export async function createManagedUser/);
  assert.match(userQueries, /export async function deleteManagedUser/);
  assert.match(userQueries, /export async function editExecutive/);

  // 2. at least one super admin, and never yourself: a leaving SuperAdmin is removed by a successor
  assert.match(userQueries, /const superAdminCount = await tx\.userRole\.count\(\{ where: \{ role: "super_admin" \} \}\);/);
  assert.match(userQueries, /if \(superAdminCount <= 1\) throw new RoleMutationError\("FINAL_SUPER_ADMIN"\);/);
  assert.match(userQueries, /if \(targetUserId === actorId\) throw new RoleMutationError\("SELF_DEMOTION"\);/);

  // 3. the executive is never deleted or removed, only replaced by editing
  assert.match(userQueries, /beforeRoles\.includes\("executive"\)\) throw new RoleMutationError\("EXECUTIVE_CANNOT_BE_DELETED"\)/);
  assert.match(userQueries, /if \(role === "executive"\) throw new RoleMutationError\("EXECUTIVE_ROLE_LOCKED"\);/);
  assert.match(userQueries, /if \(role === "advisor" && beforeRoles\.includes\("executive"\)\) \{\s*throw new RoleMutationError\("EXECUTIVE_ADVISOR_LOCKED"\);/, "the executive keeps advisor");
  assert.match(
    read("db/migrations/20261001140000_executive_holds_advisor/migration.sql"),
    /SELECT "user_id", 'advisor', "granted_by"\s+FROM "public"\."user_role"\s+WHERE "role" = 'executive'\s+ON CONFLICT \("user_id", "role"\) DO NOTHING;/,
    "the current executive is backfilled with advisor",
  );
  assert.match(userQueries, /throw new RoleMutationError\("NOT_EXECUTIVE"\)/);

  // 3b. the executive is edited in place (same row, so every FK carries over); an email (or CMU
  //     account) that belongs to another user is refused
  const editFn = userQueries.slice(userQueries.indexOf("export async function editExecutive"));
  const editBody = editFn.slice(0, editFn.indexOf("\nexport "));
  assert.match(editBody, /OR: \[\{ email: cleanEmail \}, \{ cmuAccount \}\], id: \{ not: targetUserId \}/);
  assert.match(editBody, /if \(taken\) throw new RoleMutationError\("EMAIL_ALREADY_IN_USE"\);/);
  assert.match(editBody, /tx\.appUser\.update\(\{\s*where: \{ id: targetUserId \},\s*data: \{ email: cleanEmail, cmuAccount, \.\.\.names \}/);
  assert.doesNotMatch(editBody, /appUser\.create|userRole\.(create|delete)/, "no new row and no role move");

  // 4. removing a staff member hands their open loans over, then deletes the row unless past work
  //    or another role still needs it (counted first, so an FK never aborts the transaction)
  assert.match(userQueries, /async function reassignOpenAdminLoans/);
  assert.match(userQueries, /if \(holdsAdminAccess\(remainingRoles\)\) return;/);
  assert.match(userQueries, /loan_request\.admin_reassigned/);
  assert.match(userQueries, /REASSIGNMENT_CONFLICT/);
  const deleteBody = deleteFn.slice(0, deleteFn.indexOf("export async function editExecutive"));
  assert.ok(deleteBody.indexOf("const named") < deleteBody.indexOf("tx.appUser.delete("));

  // 5. API routes exist, enforce getSuperAdminAccess, and map the guards to 409
  assert.match(usersRoute, /export async function POST/);
  assert.match(userIdRoute, /export async function DELETE/);
  assert.match(userIdRoute, /export async function PATCH/);
  assert.match(userIdRoute, /getSuperAdminAccess/);
  assert.match(userIdRoute, /isSameOrigin\(request\)/);
  for (const code of ["FINAL_SUPER_ADMIN", "SELF_DEMOTION", "NOT_EXECUTIVE", "NOT_MANAGED_USER", "REASSIGNMENT_CONFLICT", "EMAIL_ALREADY_IN_USE"]) {
    assert.match(userIdRoute, new RegExp(code));
  }
  const rolesRoute = read("app/api/super-admin/users/[id]/roles/route.ts");
  for (const code of ["SELF_DEMOTION", "EXECUTIVE_ROLE_LOCKED", "EXECUTIVE_ADVISOR_LOCKED", "REASSIGNMENT_CONFLICT"]) {
    assert.match(rolesRoute, new RegExp(code));
  }
});
