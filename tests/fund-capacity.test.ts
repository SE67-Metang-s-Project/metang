import assert from "node:assert/strict";
import { test } from "node:test";
import { computeFundCapacity, type OpenLoanMoney } from "@/lib/fund-budget";

const loan = (overrides: Partial<OpenLoanMoney>): OpenLoanMoney => ({
  status: "pending_advisor",
  amount: 0,
  approvedAmount: null,
  disbursed: 0,
  repaid: 0,
  ...overrides,
});

// db/seed.ts open loans (1-7): cash 95750, loan 7 disbursed 4500 with no ledger repayment.
const seedOpenLoans = [
  loan({ status: "draft", amount: 1500 }),
  loan({ status: "returned", amount: 2000 }),
  loan({ status: "pending_advisor", amount: 2500 }),
  loan({ status: "pending_admin", amount: 3000 }),
  loan({ status: "pending_executive", amount: 3500, approvedAmount: 3200 }),
  loan({ status: "pending_disbursement", amount: 4000, approvedAmount: 3800 }),
  loan({ status: "disbursed", amount: 4500, approvedAmount: 4500, disbursed: 4500 }),
];

test("seed data: cash 95750 must cover 16300 that may still be paid out", () => {
  assert.deepEqual(computeFundCapacity(95750, seedOpenLoans), {
    balance: 95750,
    outstanding: 4500,
    totalSystem: 100250,
    reserved: 16300,
    available: 79450,
    disbursedLoanCount: 1,
  });
});

test("the limit is cash, not money still owed", () => {
  // Cash 0, 10000 owed by a disbursed loan: nothing may be requested or withdrawn.
  const capacity = computeFundCapacity(0, [
    loan({ status: "disbursed", amount: 10000, approvedAmount: 10000, disbursed: 10000 }),
  ]);
  assert.equal(capacity.totalSystem, 10000);
  assert.equal(capacity.available, 0);
});

test("0 cash leaves no room for any open request", () => {
  assert.equal(computeFundCapacity(0, [loan({ amount: 1 })]).available, -1);
});

test("pending_disbursement reserves approvedAmount; earlier steps reserve the full amount", () => {
  assert.equal(
    computeFundCapacity(0, [
      loan({ status: "pending_disbursement", amount: 4000, approvedAmount: 3800 }),
    ]).reserved,
    3800,
  );
  // An executive return clears approvedAmount, so pending_executive must still hold `amount`.
  assert.equal(
    computeFundCapacity(0, [
      loan({ status: "pending_executive", amount: 3500, approvedAmount: 3200 }),
    ]).reserved,
    3500,
  );
});

test("every not-paid-out status is reserved; disbursed and nothing else is", () => {
  const statuses = ["draft", "returned", "pending_advisor", "pending_admin", "pending_executive"];
  const capacity = computeFundCapacity(1000, [
    ...statuses.map((status) => loan({ status, amount: 100 })),
    loan({ status: "pending_disbursement", amount: 100, approvedAmount: 100 }),
    loan({ status: "disbursed", amount: 500, approvedAmount: 500, disbursed: 500 }),
  ]);
  assert.equal(capacity.reserved, 600);
  assert.equal(capacity.available, 400);
});

test("paying a loan out never changes available, so a payout can't run out of cash", () => {
  const before = computeFundCapacity(5000, [
    loan({ status: "pending_disbursement", amount: 4000, approvedAmount: 3000 }),
  ]);
  const after = computeFundCapacity(5000 - 3000, [
    loan({ status: "disbursed", amount: 4000, approvedAmount: 3000, disbursed: 3000 }),
  ]);
  assert.equal(before.available, 2000);
  assert.equal(after.available, 2000);
  assert.ok(after.balance >= 0);
});

test("repayments add cash and raise available", () => {
  const capacity = computeFundCapacity(1500, [
    loan({ status: "disbursed", amount: 2000, approvedAmount: 2000, disbursed: 2000, repaid: 500 }),
  ]);
  assert.equal(capacity.outstanding, 1500);
  assert.equal(capacity.available, 1500);
});
