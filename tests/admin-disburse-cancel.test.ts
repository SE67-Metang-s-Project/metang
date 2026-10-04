import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("cancelAdminLoanRequest is defined with transaction and proper role checks", () => {
  const query = read("db/queries/loan-requests.ts");
  const cancelService = query.slice(query.indexOf("export async function cancelAdminLoanRequest"));

  assert.match(cancelService, /return prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(
    cancelService,
    /tx\.userRole\.findFirst\(\{\s*where: \{ userId: adminId, role: \{ in: \["admin", "super_admin"\] \} \}/,
  );
  assert.match(cancelService, /if \(!effectiveRole\) throw new AdminCancelError\("ACCESS_REVOKED"\);/);
  // A pending_admin loan assigned to another admin is theirs alone, as in decideAdminLoanRequest.
  assert.match(
    cancelService,
    /\{ status: "pending_disbursement" \},\s*\{ status: "pending_admin", OR: assignedToViewerOrNoOne\(adminId\) \}/,
  );
  assert.equal(cancelService.match(/where: cancellable/g)?.length, 2);
  assert.match(cancelService, /status: "cancelled"/);
  assert.match(cancelService, /cancelledAt/);
  // The admin is named by the rejected admin approval and the audit row; loan_request has no
  // cancelled_by since students stopped being app_user rows.
  assert.doesNotMatch(cancelService, /cancelledBy/);
  assert.match(cancelService, /decision: "rejected"/);
  // A loan awaiting disbursement already has an approved admin row. The new row needs the next
  // admin attempt, or the unique key (loan_id, step, attempt) rejects it and the cancel returns 409.
  assert.match(cancelService, /nextAttempt\(current\.approvals \?\? \[\], "admin"\)/);
  assert.doesNotMatch(cancelService, /Math\.max\(\.\.\.current\.approvals/);
  assert.match(cancelService, /action: "loan_request\.cancelled"/);
  // Students are emailed only for due-date and overdue reminders, so a cancel sends no email.
  assert.doesNotMatch(cancelService, /enqueueStudentLoanOutcome/);
});

test("POST /api/admin/loan-requests/[id]/cancel validates request and requires admin access and comment", () => {
  const route = read("app/api/admin/loan-requests/[id]/cancel/route.ts");

  assert.match(route, /const requestError = validateJsonRequest\(request\);/);
  assert.match(route, /const access = await getAdminAccess\(\);/);
  assert.match(route, /if \(!isLoanId\(id\)\) return apiError\("NOT_FOUND", "Loan request not found", 404\);/);
  assert.match(route, /กรุณาระบุเหตุผลในการยกเลิกคำร้อง/);
  assert.match(route, /cancelAdminLoanRequest\(\{/);
});

test("DisburseDebtCard implements cancel request button with reason input and confirmation modal", () => {
  const card = read("components/shared/disburse-debt/DisburseDebtCard.tsx");

  // State checks
  assert.match(card, /const\s*\[isCancelling,\s*setIsCancelling\]\s*=\s*useState\(false\);/);
  assert.match(card, /const\s*\[cancelReason,\s*setCancelReason\]\s*=\s*useState\(""\);/);
  assert.match(card, /const\s*\[completedCancel,\s*setCompletedCancel\]\s*=\s*useState<string\s*\|\s*null>\(null\);/);

  // Cancellation form elements
  assert.match(card, /ระบุเหตุผลในการยกเลิกคำร้อง/);
  assert.match(card, /textarea[\s\S]*?maxLength=\{500\}[\s\S]*?value=\{cancelReason\}/);
  assert.match(card, /กรุณาระบุเหตุผลในการยกเลิกคำร้อง/);
  assert.match(card, /ยืนยันยกเลิกคำร้อง/);

  // Endpoint called on cancel confirmation
  assert.match(card, /\/api\/admin\/loan-requests\/\$\{selectedRequest\.id\}\/cancel/);

  // Success completion modal
  assert.match(card, /ดำเนินการยกเลิกคำร้องเสร็จสิ้น/);
  assert.match(card, /FileX2/);
});
