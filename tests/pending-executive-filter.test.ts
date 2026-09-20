import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("PendingFilter and Executive Approval Filter", () => {
  it("PendingFilter contains pending_executive filter option and supports showExecutivePending", () => {
    const filterFilePath = path.join(process.cwd(), "components/shared/pending/PendingFilter.tsx");
    const content = fs.readFileSync(filterFilePath, "utf8");

    assert.ok(content.includes('pending_executive"'), "PendingFilter should include pending_executive in FilterStatus");
    assert.ok(content.includes("pendingExecutiveCount"), "PendingFilter should support pendingExecutiveCount prop");
    assert.ok(content.includes("showExecutivePending"), "PendingFilter should support showExecutivePending prop");
    assert.ok(content.includes("รอผู้บริหารอนุมัติ"), "PendingFilter should include 'รอผู้บริหารอนุมัติ' label");
  });

  it("SharedRequestsList supports pending_executive filter, counts, and admin/super_admin approval transitions", () => {
    const sharedListPath = path.join(process.cwd(), "components/shared/pending/SharedRequestsList.tsx");
    const content = fs.readFileSync(sharedListPath, "utf8");

    // Approval transitions to pending_executive for admin and super_admin
    assert.ok(
      content.includes('userRole === "admin" || userRole === "super_admin"') &&
      content.includes('"pending_executive"'),
      "Admin and Super Admin approval should set request status to pending_executive",
    );

    // PendingFilter receives pendingExecutiveCount and showExecutivePending
    assert.ok(content.includes("pendingExecutiveCount={pendingExecutiveCount}"), "SharedRequestsList should pass pendingExecutiveCount to PendingFilter");
    assert.ok(content.includes("showExecutivePending={showExecutivePending}"), "SharedRequestsList should pass showExecutivePending to PendingFilter");

    // Filter matching includes pending_executive
    assert.ok(
      content.includes('filter === "pending_executive"') &&
      content.includes('req.requestStatus === "pending_executive"'),
      "SharedRequestsList should filter requests by pending_executive",
    );
  });

  it("SuperAdminRequestsList supports pending_executive filter, counts, and approval transitions", () => {
    const superAdminListPath = path.join(process.cwd(), "components/superadmin/pending/SuperAdminRequestsList.tsx");
    const content = fs.readFileSync(superAdminListPath, "utf8");

    // Approval transitions to pending_executive
    assert.ok(
      content.includes('decision === "approved"') &&
      content.includes('"pending_executive"'),
      "SuperAdmin approval should set status to pending_executive",
    );

    // PendingFilter receives pendingExecutiveCount and showExecutivePending
    assert.ok(content.includes("pendingExecutiveCount={pendingExecutiveCount}"), "SuperAdminRequestsList should pass pendingExecutiveCount to PendingFilter");
    assert.ok(content.includes("showExecutivePending={true}"), "SuperAdminRequestsList should pass showExecutivePending={true} to PendingFilter");

    // Filter matching includes pending_executive
    assert.ok(
      content.includes('filter === "pending_executive"') &&
      content.includes('req.requestStatus === "pending_executive"'),
      "SuperAdminRequestsList should filter requests by pending_executive",
    );
  });
});
