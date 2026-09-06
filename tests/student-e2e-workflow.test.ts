import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  parseLoanInput,
  parsePhoneNumber,
  isLoanId,
} from "@/lib/loan-validation";
import {
  mapToActiveLoanSummary,
  mapToLoanDetails,
  mapToLoanRequestHistoryItem,
  computePaymentBehavior,
  type RawStudentLoan,
} from "@/lib/student-view-model";
import { mapStudentApiError, mapNetworkError } from "@/lib/student-error-mapper";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("Student routes enforce cookieAuth and JSON request security without client actor IDs", () => {
  const routes = [
    "app/api/student/loan-requests/route.ts",
    "app/api/student/loan-requests/current/route.ts",
    "app/api/student/loan-requests/[id]/route.ts",
    "app/api/student/loan-requests/[id]/resubmit/route.ts",
    "app/api/student/phone-number/route.ts",
  ];

  for (const file of routes) {
    const content = read(file);
    assert.match(content, /validateJsonRequest|getStudentSessionContext|getStudentContext/);
    assert.match(content, /@auth cookieAuth/);
    assert.doesNotMatch(content, /studentId:\s*body\.studentId/);
    assert.doesNotMatch(content, /req\.body\.actorId/);
  }
});

test("Student loan submission validates payload constraints and phone formatting", () => {
  const validPayload = {
    advisorName: "อาจารย์ทดสอบ ใจดี",
    amount: 5000,
    studentYear: 3,
    purpose: "ค่าอุปกรณ์การเรียนจำเป็น",
    additionalNote: "ขอความอนุเคราะห์เนื่องจากผู้ปกครองรายได้ลดลง",
    bankName: "ธนาคารไทยพาณิชย์",
    bankAccountNo: "1234567890",
    bankAccountName: "สมชาย นักศึกษา",
    installmentCount: 3,
  };

  const parsed = parseLoanInput(validPayload);
  assert.equal(parsed.amount, 5000);
  assert.equal(parsed.studentYear, 3);
  assert.equal(parsed.installmentCount, 3);
  assert.equal(parsed.advisorName, "อาจารย์ทดสอบ ใจดี");

  // Phone number formats: accepts 10-digit mobile and 9-digit landline with hyphen cleaning
  assert.equal(parsePhoneNumber("081-234-5678"), "0812345678");
  assert.equal(parsePhoneNumber("053-123456"), "053123456");
  assert.equal(parsePhoneNumber(" 098 765 4321 "), "0987654321");
  assert.throws(() => parsePhoneNumber("0123456789"), /phoneNumber is invalid/);
  assert.throws(() => parsePhoneNumber("123"), /phoneNumber is invalid/);

  // Invalid installment count (only 1-3 allowed)
  assert.throws(
    () => parseLoanInput({ ...validPayload, installmentCount: 4 }),
    /installmentCount is invalid/,
  );
  assert.throws(
    () => parseLoanInput({ ...validPayload, installmentCount: 0 }),
    /installmentCount is invalid/,
  );
});

test("Student view-model maps active loan, history, and timeline with Buddhist years", () => {
  const mockSubmittedLoan: RawStudentLoan = {
    id: "REQ202609060001",
    amount: 6000,
    approvedAmount: null,
    status: "pending_advisor",
    purpose: "ค่าธรรมเนียมการศึกษา",
    additionalNote: null,
    installmentCount: 3,
    firstDueDate: "2026-10-01T00:00:00.000Z",
    submittedAt: "2026-09-01T10:00:00.000Z",
    disbursedAt: null,
    advisor: { id: "adv-1", fullNameTh: "ดร.สุภาพ ชัยเจริญ" },
    approvals: [
      {
        id: "app-1",
        step: "advisor",
        decision: "pending",
        comment: null,
        decidedAt: null,
        attempt: 1,
      },
    ],
  };

  const activeSummary = mapToActiveLoanSummary(mockSubmittedLoan);
  assert.ok(activeSummary);
  assert.equal(activeSummary.requestNumber, "REQ202609060001");
  assert.equal(activeSummary.statusLabel, "รออาจารย์ที่ปรึกษาพิจารณา");
  assert.equal(activeSummary.statusType, "waitingAdvisorApproval");

  const historyItem = mapToLoanRequestHistoryItem(mockSubmittedLoan);
  assert.equal(historyItem.requestNumber, "REQ202609060001");
  assert.equal(historyItem.amount, "6,000 บาท");
  assert.ok(isLoanId(mockSubmittedLoan.id));

  const details = mapToLoanDetails(mockSubmittedLoan);
  assert.equal(details.requestNumber, "REQ202609060001");
  assert.ok(details.timeline.length > 0);
  assert.equal(details.schedule.length, 3);

  // Compute payment behavior
  const behavior = computePaymentBehavior([mockSubmittedLoan]);
  assert.equal(behavior.totalLoanRequests, 1);
  assert.equal(behavior.totalInstallments, 0);
  assert.equal(behavior.onTimeStatusLabel, "ยังไม่มีประวัติการชำระเงิน");
});

test("Student view-model and page state correctly handle returned loans and comments", () => {
  const mockReturnedLoan: RawStudentLoan = {
    id: "REQ202609060002",
    amount: 4000,
    approvedAmount: null,
    status: "returned",
    purpose: "ค่าครองชีพ",
    additionalNote: null,
    installmentCount: 2,
    firstDueDate: "2026-09-15T00:00:00.000Z",
    submittedAt: "2026-08-15T08:00:00.000Z",
    disbursedAt: null,
    advisor: { id: "adv-1", fullNameTh: "ดร.สุภาพ ชัยเจริญ" },
    approvals: [
      {
        id: "app-1",
        step: "advisor",
        decision: "returned",
        comment: "กรุณาแนบเลขบัญชีธนาคารที่เป็นชื่อของนักศึกษาเท่านั้น",
        decidedAt: "2026-08-16T09:30:00.000Z",
        attempt: 1,
      },
    ],
  };

  const activeSummary = mapToActiveLoanSummary(mockReturnedLoan);
  assert.ok(activeSummary);
  assert.equal(activeSummary.status, "returned");
  assert.equal(activeSummary.statusLabel, "ส่งกลับแก้ไข");
  assert.equal(activeSummary.statusType, "revisionRequired");

  const details = mapToLoanDetails(mockReturnedLoan);
  const returnedTimelineItem = details.timeline.find(
    (item) => item.title.includes("อาจารย์ที่ปรึกษา") && item.comment,
  );
  assert.ok(returnedTimelineItem, "Returned timeline item must have advisor return comment");
  assert.equal(
    returnedTimelineItem.comment,
    "กรุณาแนบเลขบัญชีธนาคารที่เป็นชื่อของนักศึกษาเท่านั้น",
  );
});

test("Student error mapper converts all HTTP error classes to localized UI states", () => {
  // 401 Unauthorized
  const unauth = mapStudentApiError(401);
  assert.equal(unauth.code, "UNAUTHORIZED");
  assert.equal(unauth.action, "login");

  // 409 Conflict: initial vs resubmit
  const conflictInitial = mapStudentApiError(409, null, { isResubmit: false });
  assert.equal(conflictInitial.code, "CONFLICT");
  assert.equal(conflictInitial.action, "dashboard");

  const conflictResubmit = mapStudentApiError(409, null, { isResubmit: true });
  assert.equal(conflictResubmit.code, "CONFLICT");
  assert.equal(conflictResubmit.action, "refresh");

  // 422 Validation Error targeting fields
  const advisorError = mapStudentApiError(422, {
    error: { message: "advisorName is ambiguous or not found" },
  });
  assert.equal(advisorError.field, "advisorName");

  const amountError = mapStudentApiError(422, {
    error: { message: "amount is invalid" },
  });
  assert.equal(amountError.field, "loanAmount");

  // Network error
  const networkError = mapNetworkError(new Error("Connection refused"));
  assert.equal(networkError.code, "NETWORK_ERROR");
  assert.equal(networkError.action, "retry");
});

test("OpenAPI documents all Student loan endpoints with cookieAuth and responses", () => {
  const document = JSON.parse(read("public/openapi.json"));

  const paths = [
    "/student/loan-requests",
    "/student/loan-requests/{id}",
    "/student/loan-requests/current",
    "/student/loan-requests/{id}/resubmit",
  ];

  for (const path of paths) {
    const item = document.paths?.[path];
    assert.ok(item, `missing path in openapi: ${path}`);
    const operations = [item.get, item.post].filter(Boolean);
    for (const op of operations) {
      assert.ok(
        op.security?.some((s: Record<string, unknown>) => "cookieAuth" in s),
        `operation in ${path} must declare cookieAuth`,
      );
    }
  }

  // Verify resubmit operation responses
  const resubmitPost = document.paths["/student/loan-requests/{id}/resubmit"]?.post;
  assert.ok(resubmitPost);
  for (const status of ["200", "401", "403", "404", "409", "422", "500"]) {
    assert.ok(resubmitPost.responses?.[status], `resubmit must declare response ${status}`);
  }
});
