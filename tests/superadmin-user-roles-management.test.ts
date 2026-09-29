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

  // 1. db/queries/users.ts must export createManagedUser, deleteManagedUser, and updateManagedUser
  assert.match(userQueries, /export async function createManagedUser/);
  assert.match(userQueries, /export async function deleteManagedUser/);
  assert.match(userQueries, /export async function updateManagedUser/);

  // 2. deleteManagedUser must protect the final super admin
  assert.match(userQueries, /const superAdminCount = await tx\.userRole\.count\(\{ where: \{ role: "super_admin" \} \}\);/);
  assert.match(userQueries, /if \(superAdminCount <= 1\)\s*\{\s*throw new RoleMutationError\("FINAL_SUPER_ADMIN"\);/);

  // 3. deleteManagedUser must prevent executive deletion (executive can only be edited)
  assert.match(userQueries, /EXECUTIVE_CANNOT_BE_DELETED/);

  // 4. deleteManagedUser must reassign admin loans
  assert.match(userQueries, /loan_request\.admin_reassigned/);

  // 5. updateManagedUser must prevent duplicate email
  assert.match(userQueries, /EMAIL_ALREADY_IN_USE/);

  // 6. API routes exist and enforce getSuperAdminAccess
  assert.match(usersRoute, /export async function POST/);
  assert.match(userIdRoute, /export async function DELETE/);
  assert.match(userIdRoute, /export async function PATCH/);
  assert.match(userIdRoute, /getSuperAdminAccess/);
  assert.match(userIdRoute, /FINAL_SUPER_ADMIN/);
});
