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
  assert.match(cancelService, /status: \{ in: \["pending_disbursement", "pending_admin"\] \}/);
  assert.match(cancelService, /status: "cancelled"/);
  assert.match(cancelService, /cancelledAt/);
  assert.match(cancelService, /cancelledBy: adminId/);
  assert.match(cancelService, /decision: "rejected"/);
  assert.match(cancelService, /action: "loan_request\.cancelled"/);
  assert.match(cancelService, /await enqueueStudentLoanOutcome\(tx, \{ loanId: id, outcome: "rejected" \}\);/);
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
