import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeFundBudgetTotals,
  computeUsagePercentage,
  mapFundTransactionError,
  resolveFundAdjustment,
  type FundBudgetOverview,
} from "@/lib/fund-budget";

const overview = (
  overrides: Partial<FundBudgetOverview> = {},
): FundBudgetOverview => ({
  balance: 100,
  transactions: [],
  pendingDisbursement: 0,
  ...overrides,
});

test("computeFundBudgetTotals: spentAmount sums only disbursement-kind transactions", () => {
  const totals = computeFundBudgetTotals(
    overview({
      balance: 100,
      pendingDisbursement: 0,
      transactions: [
        { kind: "disbursement", amount: 50 },
        { kind: "top_up", amount: 200 },
        { kind: "withdrawal", amount: 30 },
        { kind: "credit_adjustment", amount: 40 },
        { kind: "debit_adjustment", amount: 10 },
        { kind: "repayment", amount: 20 },
      ],
    }),
  );
  assert.equal(totals.spentAmount, 50);
});

test("computeFundBudgetTotals: empty transactions gives spentAmount 0", () => {
  const totals = computeFundBudgetTotals(overview({ transactions: [] }));
  assert.equal(totals.spentAmount, 0);
});

test("computeFundBudgetTotals: pendingAmount and remainingBudget pass through unchanged", () => {
  const totals = computeFundBudgetTotals(overview({ balance: 777, pendingDisbursement: 333 }));
  assert.equal(totals.remainingBudget, 777);
  assert.equal(totals.pendingAmount, 333);
});

test("computeFundBudgetTotals: currentTotal nets only capital-adjustment kinds (top_up/withdrawal/credit_adjustment/debit_adjustment)", () => {
  const totals = computeFundBudgetTotals(
    overview({
      balance: 0,
      pendingDisbursement: 0,
      transactions: [
        { kind: "top_up", amount: 1000 },
        { kind: "credit_adjustment", amount: 200 },
        { kind: "withdrawal", amount: 100 },
        { kind: "debit_adjustment", amount: 50 },
        // Loan activity must not affect currentTotal at all:
        { kind: "disbursement", amount: 9999 },
        { kind: "repayment", amount: 9999 },
      ],
    }),
  );
  assert.equal(totals.currentTotal, 1000 + 200 - 100 - 50);
});

test("computeFundBudgetTotals: currentTotal does not double-count repayments via balance", () => {
  // A loan is disbursed (500) then fully repaid (500). balance already nets this to 0
  // (500 top_up - 500 disbursement + 500 repayment = 500), so currentTotal must reflect only
  // the original 500 top_up, not balance + spentAmount + pendingAmount (which would double it).
  const totals = computeFundBudgetTotals(
    overview({
      balance: 500,
      pendingDisbursement: 0,
      transactions: [
        { kind: "top_up", amount: 500 },
        { kind: "disbursement", amount: 500 },
        { kind: "repayment", amount: 500 },
      ],
    }),
  );
  assert.equal(totals.currentTotal, 500);
});

test("computeUsagePercentage: currentTotal 0 or negative returns 0", () => {
  assert.equal(
    computeUsagePercentage({ spentAmount: 10, pendingAmount: 10, currentTotal: 0 }),
    0,
  );
  assert.equal(
    computeUsagePercentage({ spentAmount: 10, pendingAmount: 10, currentTotal: -100 }),
    0,
  );
});

test("computeUsagePercentage: computes (spent+pending)/currentTotal * 100", () => {
  assert.equal(
    computeUsagePercentage({ spentAmount: 20, pendingAmount: 10, currentTotal: 100 }),
    30,
  );
});

test("computeUsagePercentage: caps at 100 when spent+pending exceeds currentTotal", () => {
  assert.equal(
    computeUsagePercentage({ spentAmount: 150, pendingAmount: 50, currentTotal: 100 }),
    100,
  );
});

test("resolveFundAdjustment: target equal to currentTotal returns null", () => {
  assert.equal(resolveFundAdjustment(500, 500), null);
});

test("resolveFundAdjustment: target above currentTotal returns a positive credit_adjustment", () => {
  assert.deepEqual(resolveFundAdjustment(600, 500), {
    kind: "credit_adjustment",
    amount: 100,
  });
});

test("resolveFundAdjustment: target below currentTotal returns a positive debit_adjustment", () => {
  assert.deepEqual(resolveFundAdjustment(400, 500), {
    kind: "debit_adjustment",
    amount: 100,
  });
  const result = resolveFundAdjustment(400, 500);
  assert.ok(result && result.amount > 0, "amount must always be positive");
});

test("mapFundTransactionError: 401 always returns the session-expired message", () => {
  assert.equal(
    mapFundTransactionError(401, "SOMETHING_ELSE", "unused fallback"),
    "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)",
  );
});

test("mapFundTransactionError: 403 always returns the no-permission message", () => {
  assert.equal(
    mapFundTransactionError(403, undefined, "unused fallback"),
    "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้",
  );
});

test("mapFundTransactionError: 409 INSUFFICIENT_FUNDS returns the specific message, not the fallback", () => {
  assert.equal(
    mapFundTransactionError(409, "INSUFFICIENT_FUNDS", "The fund balance cannot go negative"),
    "ยอดคงเหลือไม่สามารถติดลบได้",
  );
});

test("mapFundTransactionError: 409 with other errorCode falls back to the server message, or a generic one", () => {
  assert.equal(mapFundTransactionError(409, "CONFLICT", "The request changed; please retry"), "The request changed; please retry");
  assert.equal(mapFundTransactionError(409, undefined, ""), "เกิดข้อขัดแย้ง กรุณาลองใหม่");
});

test("mapFundTransactionError: 422 returns fallback when present, else generic validation message", () => {
  assert.equal(mapFundTransactionError(422, "VALIDATION_ERROR", "amount is invalid"), "amount is invalid");
  assert.equal(mapFundTransactionError(422, "VALIDATION_ERROR", ""), "ข้อมูลไม่ถูกต้อง");
});

test("mapFundTransactionError: unrecognized status falls back to fallback, else a generic save-error message", () => {
  assert.equal(mapFundTransactionError(500, undefined, "boom"), "boom");
  assert.equal(mapFundTransactionError(500, undefined, ""), "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
});
