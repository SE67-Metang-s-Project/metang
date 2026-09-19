import assert from "node:assert/strict";
import { test } from "node:test";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

function filterAdvisorStudents(requests: ActionRequest[]): ActionRequest[] {
  return requests.filter((req) => {
    if (req.requestStatus !== "disbursed") return false;
    const totalDue =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0)
        : Number(req.approvedAmount ?? req.amount ?? 0);
    const totalPaid =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.paidAmount || 0), 0)
        : 0;
    const remainingBalance = Math.max(0, totalDue - totalPaid);
    return remainingBalance > 0;
  });
}

function createMockRequest(
  id: string,
  studentId: string,
  requestStatus: string,
  amount: number,
  approvedAmount: number | null,
  installments?: { amount: number; paidAmount: number }[],
): ActionRequest {
  return {
    id,
    studentId,
    name: `Student ${studentId}`,
    major: "พยาบาลศาสตร์",
    year: "3",
    objective: "ค่าเล่าเรียน",
    amount: String(amount),
    approvedAmount,
    term: "1",
    submitDate: "1 ม.ค. 2569",
    requestStatus,
    installments: installments?.map((inst, index) => ({
      installmentNumber: index + 1,
      dueDate: "1 ก.พ. 2569",
      amount: String(inst.amount),
      paidAmount: String(inst.paidAmount),
      isPaid: inst.paidAmount >= inst.amount,
    })),
  };
}

test("advisor students list displays only disbursed loans with unpaid debt", () => {
  const requests: ActionRequest[] = [
    // 1. Pending advisor review (not disbursed)
    createMockRequest("REQ01", "STU01", "pending_advisor", 3000, null),
    // 2. Pending admin review (not disbursed)
    createMockRequest("REQ02", "STU02", "pending_admin", 3000, null),
    // 3. Pending executive review (not disbursed)
    createMockRequest("REQ03", "STU03", "pending_executive", 3000, 3000),
    // 4. Pending disbursement by admin (not yet transferred)
    createMockRequest("REQ04", "STU04", "pending_disbursement", 4000, 4000),
    // 5. Disbursed with remaining debt (admin transferred, unpaid debt)
    createMockRequest("REQ05", "STU05", "disbursed", 5000, 5000, [
      { amount: 2500, paidAmount: 2500 },
      { amount: 2500, paidAmount: 0 },
    ]),
    // 6. Disbursed with all installments paid
    createMockRequest("REQ06", "STU06", "disbursed", 3000, 3000, [
      { amount: 1500, paidAmount: 1500 },
      { amount: 1500, paidAmount: 1500 },
    ]),
    // 7. Closed loan (already fully repaid)
    createMockRequest("REQ07", "STU07", "closed", 4000, 4000, [
      { amount: 2000, paidAmount: 2000 },
      { amount: 2000, paidAmount: 2000 },
    ]),
    // 8. Rejected loan
    createMockRequest("REQ08", "STU08", "rejected", 2000, null),
    // 9. Cancelled loan
    createMockRequest("REQ09", "STU09", "cancelled", 2000, null),
  ];

  const filtered = filterAdvisorStudents(requests);

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "REQ05");
  assert.equal(filtered[0].studentId, "STU05");
  assert.equal(filtered[0].requestStatus, "disbursed");
});
