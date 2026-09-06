import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mapLoanStatus,
  formatThaiDate,
  formatThaiDateTime,
  mapToLoanRequestHistoryItem,
  mapToActiveLoanSummary,
  mapToInstallmentPayments,
  mapToLoanDetails,
  type RawStudentLoan,
} from "@/lib/student-view-model";

test("maps all LoanStatus values to expected Thai labels and UI types", () => {
  assert.deepEqual(mapLoanStatus("pending_advisor"), {
    label: "รออาจารย์ที่ปรึกษาพิจารณา",
    statusType: "waitingAdvisorApproval",
  });
  assert.deepEqual(mapLoanStatus("pending_admin"), {
    label: "รอเจ้าหน้าที่ตรวจสอบเอกสาร",
    statusType: "waitingDocumentReview",
  });
  assert.deepEqual(mapLoanStatus("pending_executive"), {
    label: "รอผู้บริหารอนุมัติ",
    statusType: "waitingExecutiveApproval",
  });
  assert.deepEqual(mapLoanStatus("pending_disbursement"), {
    label: "รอยืนยันการโอนเงิน",
    statusType: "waitingPaymentConfirmation",
  });
  assert.deepEqual(mapLoanStatus("returned"), {
    label: "ส่งกลับแก้ไข",
    statusType: "revisionRequired",
  });
  assert.deepEqual(mapLoanStatus("closed"), {
    label: "เสร็จสิ้น (ชำระครบแล้ว)",
    statusType: "completed",
  });
  assert.deepEqual(mapLoanStatus("rejected"), {
    label: "ไม่อนุมัติ",
    statusType: "rejectedExecutive",
  });
});

test("formats dates in Buddhist calendar format (BE)", () => {
  const date = new Date("2026-09-06T10:30:00Z");
  assert.match(formatThaiDate(date), /2569/);
  assert.match(formatThaiDateTime(date), /2569.*น\./);
});

test("maps loan to LoanRequestHistoryItem", () => {
  const loan: RawStudentLoan = {
    id: "loan-1234",
    amount: 5000,
    approvedAmount: 5000,
    purpose: "ค่าครองชีพฉุกเฉิน",
    installmentCount: 2,
    firstDueDate: "2026-10-01",
    status: "pending_advisor",
    submittedAt: "2026-09-01T08:00:00Z",
  };

  const historyItem = mapToLoanRequestHistoryItem(loan);
  assert.equal(historyItem.requestNumber, "loan-1234");
  assert.equal(historyItem.statusLabel, "รออาจารย์ที่ปรึกษาพิจารณา");
  assert.equal(historyItem.statusType, "waitingAdvisorApproval");
  assert.equal(historyItem.amount, "5,000 บาท");
  assert.equal(historyItem.purpose, "ค่าครองชีพฉุกเฉิน");
});

test("maps loan to ActiveLoanSummary", () => {
  const loan: RawStudentLoan = {
    id: "loan-active",
    amount: 6000,
    approvedAmount: 6000,
    purpose: "ค่าเทอม",
    installmentCount: 3,
    firstDueDate: "2026-10-15",
    status: "disbursed",
    installments: [
      { seq: 1, dueDate: "2026-10-15", amountDue: 2000, amountPaid: 2000, settledAt: "2026-10-10" },
      { seq: 2, dueDate: "2026-11-15", amountDue: 2000, amountPaid: 0, settledAt: null },
      { seq: 3, dueDate: "2026-12-15", amountDue: 2000, amountPaid: 0, settledAt: null },
    ],
  };

  const summary = mapToActiveLoanSummary(loan);
  assert.ok(summary);
  assert.equal(summary.paidAmount, "2,000");
  assert.equal(summary.totalAmount, "6,000");
  assert.equal(summary.nextInstallmentNumber, 2);
  assert.equal(summary.isDisbursed, true);
});

test("builds timeline in mapToLoanDetails including comments on return", () => {
  const loan: RawStudentLoan = {
    id: "loan-detail-test",
    amount: 4000,
    purpose: "ค่ารักษาพยาบาล",
    installmentCount: 2,
    firstDueDate: "2026-10-01",
    status: "returned",
    submittedAt: "2026-09-01T08:00:00Z",
    advisor: { fullNameTh: "อ. สมศรี ใจดี" },
    approvals: [
      {
        step: "advisor",
        attempt: 1,
        decision: "returned",
        decidedAt: "2026-09-02T10:00:00Z",
        comment: "แนบเอกสารใบเสร็จเพิ่มเติม",
        decider: { fullNameTh: "อ. สมศรี ใจดี" },
      },
    ],
  };

  const details = mapToLoanDetails(loan);
  assert.equal(details.timeline.length, 2);
  assert.equal(details.timeline[0].title, "ยื่นคำร้องกู้ยืมเงิน");
  assert.equal(details.timeline[1].title, "อาจารย์ที่ปรึกษาส่งกลับแก้ไข");
  assert.equal(details.timeline[1].actor, "อ. สมศรี ใจดี");
  assert.equal(details.timeline[1].comment, "แนบเอกสารใบเสร็จเพิ่มเติม");
});

test("maps installments to InstallmentPayment display objects", () => {
  const installments = [
    { seq: 1, dueDate: "2026-10-15", amountDue: 2000, amountPaid: 2000, settledAt: "2026-10-10" },
    { seq: 2, dueDate: "2026-11-15", amountDue: 2000, amountPaid: 500, settledAt: null },
    { seq: 3, dueDate: "2026-12-15", amountDue: 2000, amountPaid: 0, settledAt: null },
  ];

  const payments = mapToInstallmentPayments(installments);
  assert.equal(payments.length, 3);
  assert.equal(payments[0].status, "paid");
  assert.equal(payments[1].status, "current");
  assert.equal(payments[2].status, "upcoming");
});
