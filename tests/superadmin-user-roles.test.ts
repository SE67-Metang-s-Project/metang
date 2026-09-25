import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("UserRolesTab in System Control Center only manages admin, super_admin, and executive", () => {
  const content = read("components/superadmin/setting/UserRolesTab.tsx");

  // 1. Check MANAGED_ROLES definition
  assert.match(
    content,
    /const\s+MANAGED_ROLES\s*=\s*new\s+Set<PredefinedRoleName>\(\s*\["admin",\s*"executive",\s*"super_admin"\]\s*\);/,
    "MANAGED_ROLES must strictly only include admin, executive, super_admin",
  );

  // 2. Check THAI_TO_ROLE definition only contains managed roles
  assert.match(
    content,
    /const\s+THAI_TO_ROLE:\s*Record<string,\s*PredefinedRoleName>\s*=\s*\{\s*"เจ้าหน้าที่":\s*"admin",\s*"ผู้บริหาร":\s*"executive",\s*"ผู้ดูแลระบบ":\s*"super_admin",?\s*\};/,
    "THAI_TO_ROLE must only map managed roles",
  );

  // 3. Role filter dropdown must only have all, admin, executive, super_admin
  const filterDropdownStart = content.indexOf("value={roleFilter}");
  assert.ok(filterDropdownStart !== -1, "Must contain roleFilter select");
  const filterDropdownEnd = content.indexOf("</select>", filterDropdownStart);
  const roleFilterSection = content.slice(filterDropdownStart, filterDropdownEnd);

  assert.ok(roleFilterSection.includes('<option value="ทุกบทบาท">ทุกบทบาท</option>'));
  assert.ok(roleFilterSection.includes('<option value="เจ้าหน้าที่">เจ้าหน้าที่</option>'));
  assert.ok(roleFilterSection.includes('<option value="ผู้บริหาร">ผู้บริหาร</option>'));
  assert.ok(roleFilterSection.includes('<option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>'));
  assert.ok(!roleFilterSection.includes("นักศึกษา"), "Filter dropdown must not contain นักศึกษา");
  assert.ok(!roleFilterSection.includes("อาจารย์ที่ปรึกษา"), "Filter dropdown must not contain อาจารย์ที่ปรึกษา");

  // 4. filteredUsers must only include users having at least one managed role
  assert.match(
    content,
    /const\s+hasManagedRole\s*=\s*user\.roles\.some\(\(r\)\s*=>\s*MANAGED_ROLES\.has\(r\.role\)\);\s*if\s*\(!hasManagedRole\)\s*return\s*false;/,
    "filteredUsers must exclude users without any managed role",
  );

  // 5. Role select dropdowns in Mobile and Desktop views must only include managed roles
  // No <option value="นักศึกษา"> or <option value="อาจารย์ที่ปรึกษา"> in the entire file
  assert.ok(
    !content.includes('<option value="นักศึกษา">'),
    "No dropdown in UserRolesTab should have option นักศึกษา",
  );
  assert.ok(
    !content.includes('<option value="อาจารย์ที่ปรึกษา">'),
    "No dropdown in UserRolesTab should have option อาจารย์ที่ปรึกษา",
  );

  // 6. Badges must be filtered by MANAGED_ROLES
  assert.match(
    content,
    /user\.roles\.filter\(\(r\)\s*=>\s*MANAGED_ROLES\.has\(r\.role\)\)\.length\s*>\s*1/,
    "Multi-role badges must only display when there are multiple managed roles",
  );
});
