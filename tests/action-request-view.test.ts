import assert from "node:assert/strict";
import { test } from "node:test";
import {
  conductFromRows,
  summarizeStudentConduct,
  toActionRequest,
  type ActionRequestRow,
  type ActionRequestView,
} from "@/lib/action-request-view";

const NOW = new Date("2026-09-29T05:00:00Z");

const row: ActionRequestRow = {
  id: "L-1",
  studentYear: 3,
  purpose: "tuition",
  amount: 3000,
  approvedAmount: 3000,
  installmentCount: 2,
  status: "disbursed",
  submittedAt: new Date("2026-08-01T03:00:00Z"),
  createdAt: new Date("2026-07-31T03:00:00Z"),
  cancelledAt: null,
  bankName: "KBank",
  bankAccountNo: "123-4-56789-0",
  bankAccountName: "Somchai",
  studentCode: "650510001",
  studentNameTh: "สมชาย",
  studentPhone: "0812345678",
  studentEducationLevel: null,
  advisor: { fullNameTh: "อ.สมหญิง" },
  approvals: [],
  installments: [
    { id: BigInt(1), seq: 1, dueDate: new Date("2026-09-01"), amountDue: 1500, amountPaid: 1500, settledAt: new Date("2026-08-30") },
    { id: BigInt(2), seq: 2, dueDate: new Date("2026-10-01"), amountDue: 1500, amountPaid: 0, settledAt: null },
  ],
  payments: [
    {
      id: "p-1",
      installmentId: BigInt(1),
      status: "confirmed",
      amount: 1500,
      paidAt: new Date("2026-08-29T03:00:00Z"),
      confirmedAt: new Date("2026-08-30T03:00:00Z"),
      createdAt: new Date("2026-08-29T03:00:00Z"),
      reviewNote: null,
      slipPath: "slips/p-1.png",
    },
  ],
  fundTransactions: [{ id: BigInt(7) }],
};

const view = (over: Partial<ActionRequestView> = {}): ActionRequestView => ({
  bank: true,
  slipLinks: true,
  schedule: true,
  conduct: true,
  ...over,
});

test("bankDetails is present only when the view asks for it", () => {
  assert.equal(toActionRequest(row, view(), undefined, NOW).bankDetails?.accountNumber, "123-4-56789-0");
  assert.equal("bankDetails" in toActionRequest(row, view({ bank: false }), undefined, NOW), false);
});

test("slip links are present only when the view asks for them", () => {
  const withLinks = toActionRequest(row, view(), undefined, NOW);
  assert.match(withLinks.slipUrl ?? "", /\/api\/fund-transactions\/7\/slip$/);
  assert.match(withLinks.paymentHistory?.[0].slipImageUrl ?? "", /\/api\/payments\/p-1\/slip$/);

  const without = toActionRequest(row, view({ slipLinks: false }), undefined, NOW);
  assert.equal("slipUrl" in without, false);
  assert.equal("slipImageUrl" in (without.paymentHistory?.[0] ?? {}), false);
});

test("fields no page reads are never emitted", () => {
  const out = toActionRequest({ ...row, additionalNote: "note" } as ActionRequestRow, view(), undefined, NOW);
  assert.equal("additionalNote" in out, false);
  assert.equal("installmentOutstandingAmount" in (out.paymentHistory?.[0] ?? {}), false);
});

test("conduct comes from the aggregated installments and confirmed payments", () => {
  const conduct = summarizeStudentConduct(
    [
      {
        installments: [
          { seq: 1, dueDate: new Date("2026-09-01"), amountDue: 1500, amountPaid: 1500, settledAt: new Date("2026-08-30") },
          { seq: 2, dueDate: new Date("2026-09-15"), amountDue: 1500, amountPaid: 0, settledAt: null },
        ],
        payments: [
          { status: "confirmed", amount: 1500, paidAt: new Date("2026-08-29T03:00:00Z"), confirmedAt: new Date("2026-08-30T03:00:00Z"), createdAt: new Date("2026-08-29T03:00:00Z") },
        ],
      },
    ],
    4,
  );
  // Installment 1 paid before its due date; installment 2 is unsettled and due date passed.
  assert.equal(conduct.onTime, 1);
  assert.equal(conduct.late, 1);
  assert.equal(conduct.totalLoanRequests, 4);

  const out = toActionRequest(row, view(), conduct, NOW);
  assert.equal(out.paymentBehavior?.totalInstallments, 2);
  assert.equal(out.paymentBehavior?.onTimeStatusLabel, "ชำระล่าช้า");
  assert.equal("paymentBehavior" in toActionRequest(row, view({ conduct: false }), conduct, NOW), false);
});

test("verify-slip rows keep only what VerifySlipCard reads", () => {
  const withApproval: ActionRequestRow = {
    ...row,
    approvals: [
      {
        step: "admin",
        decision: "approved",
        comment: null,
        decidedAt: new Date("2026-08-02T03:00:00Z"),
        createdAt: new Date("2026-08-02T03:00:00Z"),
        decider: { fullNameTh: "แอดมิน" },
      },
    ],
  };
  const full = toActionRequest(withApproval, view(), undefined, NOW);
  const slim = toActionRequest(withApproval, view({ verifySlip: true, bank: false, conduct: false }), undefined, NOW);

  assert.equal(full.history?.length, 2);
  assert.equal(slim.history?.length, 1, "the submit entry carries the time VerifySlipCard shows");
  assert.equal(slim.history?.[0].date, full.history?.[0].date);
  for (const key of ["approvals", "program", "educationLevel", "advisorName", "approvedAmount", "waitDays", "isOverdue", "submitTime", "submittedAt", "slipUrl"]) {
    assert.equal(key in slim, false, key);
  }
  assert.equal("isPaid" in (slim.installments?.[0] ?? {}), false);
  assert.equal("reviewedAt" in (slim.paymentHistory?.[0] ?? {}), false);
  // What the verify-slip modal does read stays.
  assert.equal(slim.phone, "0812345678");
  // Verify-slip bills the approved amount; other views keep the requested one.
  const lowered = { ...withApproval, amount: 5000, approvedAmount: 3000 };
  assert.equal(toActionRequest(lowered, view({ verifySlip: true }), undefined, NOW).amount, "3000");
  assert.equal(toActionRequest({ ...lowered, approvedAmount: null }, view({ verifySlip: true }), undefined, NOW).amount, "5000");
  assert.equal(toActionRequest(lowered, view(), undefined, NOW).amount, "5000");
  assert.match(slim.paymentHistory?.[0].slipImageUrl ?? "", /\/api\/payments\/p-1\/slip$/);
  // paidTime is read by VerifySlipCard (its own PaymentEvidence type), not declared on PaymentRecord.
  const paidTime = (r: typeof full) => (r.paymentHistory?.[0] as Record<string, unknown>).paidTime;
  assert.ok(paidTime(slim));
  assert.equal(paidTime(slim), paidTime(full));
});

test("conduct from loaded rows matches the per-student aggregation, and counts drafts through totals", () => {
  const paid = { seq: 1, dueDate: new Date("2026-09-01"), amountDue: 1500, amountPaid: 1500, settledAt: new Date("2026-08-30") };
  const open = { seq: 2, dueDate: new Date("2026-09-15"), amountDue: 1500, amountPaid: 0, settledAt: null };
  const payment = {
    status: "confirmed",
    amount: 1500,
    paidAt: new Date("2026-08-29T03:00:00Z"),
    confirmedAt: new Date("2026-08-30T03:00:00Z"),
    createdAt: new Date("2026-08-29T03:00:00Z"),
  };
  const pending = { ...payment, status: "pending_review" };
  const rows = [
    { studentCode: "s1", installments: [paid, open], payments: [payment, pending] },
    { studentCode: "s1", installments: [], payments: [] },
    { studentCode: "s2", installments: [], payments: [] },
  ];
  const result = conductFromRows(rows, [
    { studentCode: "s1", count: 3 },
    { studentCode: "s2", count: 1 },
  ]);
  assert.deepEqual(result.get("s1"), summarizeStudentConduct([{ installments: [paid, open], payments: [payment] }], 3));
  assert.deepEqual(result.get("s1"), { totalLoanRequests: 3, onTime: 1, late: 1 });
  assert.deepEqual(result.get("s2"), { totalLoanRequests: 1, onTime: 0, late: 0 });
});

test("Thai dates and times are Bangkok wall clock, not the server's time zone", () => {
  // 2026-08-31T18:30Z is 01:30 on 1 Sep in Bangkok, whatever TZ the server runs in.
  const late = { ...row, submittedAt: new Date("2026-08-31T18:30:00Z") };
  const out = toActionRequest(late, view(), undefined, NOW);
  assert.equal(out.submitDate, "1 ก.ย. 2569");
  assert.equal(out.submitTime, "01:30 น.");
  assert.equal(out.history?.[0].date, "1 ก.ย. 2569 01:30");
});
