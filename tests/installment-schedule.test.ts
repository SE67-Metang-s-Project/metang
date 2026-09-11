import assert from "node:assert/strict";
import { test } from "node:test";
import { computeInstallmentSchedule } from "@/lib/loan-validation";

function isoDates(schedule: ReturnType<typeof computeInstallmentSchedule>) {
  return schedule.map((entry) => entry.dueDate.toISOString().slice(0, 10));
}

test("splits evenly when approvedAmount divides installmentCount", () => {
  const schedule = computeInstallmentSchedule(300, 3, new Date("2026-01-01T00:00:00.000Z"));
  assert.deepEqual(
    schedule.map((entry) => ({ seq: entry.seq, amountDue: entry.amountDue })),
    [
      { seq: 1, amountDue: 100 },
      { seq: 2, amountDue: 100 },
      { seq: 3, amountDue: 100 },
    ],
  );
  assert.deepEqual(isoDates(schedule), ["2026-01-01", "2026-01-31", "2026-03-02"]);
});

test("last installment absorbs the floor() remainder", () => {
  const schedule = computeInstallmentSchedule(100, 3, new Date("2026-01-01T00:00:00.000Z"));
  assert.deepEqual(
    schedule.map((entry) => entry.amountDue),
    [33, 33, 34],
  );
  assert.equal(
    schedule.reduce((sum, entry) => sum + entry.amountDue, 0),
    100,
  );
});

test("sums to approvedAmount exactly across a range of inputs", () => {
  for (const [amount, count] of [[1, 1], [2, 3], [10, 3], [9999, 4], [7, 5]] as const) {
    const schedule = computeInstallmentSchedule(amount, count, new Date("2026-06-15T00:00:00.000Z"));
    assert.equal(schedule.length, count);
    assert.equal(
      schedule.reduce((sum, entry) => sum + entry.amountDue, 0),
      amount,
    );
  }
});

test("single installment covers the full amount, due on firstDueDate", () => {
  const schedule = computeInstallmentSchedule(500, 1, new Date("2026-03-10T00:00:00.000Z"));
  assert.deepEqual(schedule, [
    { seq: 1, dueDate: new Date("2026-03-10T00:00:00.000Z"), amountDue: 500 },
  ]);
});

test("dueDate for seq i is firstDueDate + 30*(i-1) days", () => {
  const schedule = computeInstallmentSchedule(400, 4, new Date("2026-01-01T00:00:00.000Z"));
  assert.deepEqual(isoDates(schedule), ["2026-01-01", "2026-01-31", "2026-03-02", "2026-04-01"]);
});
