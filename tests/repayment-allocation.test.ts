import assert from "node:assert/strict";
import test from "node:test";

import { allocatePayment, type PaymentAllocationTarget } from "@/lib/loan-validation";

const schedule = (count: number, amountDue = 1000): PaymentAllocationTarget[] =>
  Array.from({ length: count }, (_, index) => ({
    id: BigInt(index + 1),
    seq: index + 1,
    amountDue,
    amountPaid: 0,
  }));

/** seq -> new amountPaid, for readable assertions on which installments moved. */
const touched = (result: ReturnType<typeof allocatePayment>) =>
  Object.fromEntries(result.allocations.map((entry) => [Number(entry.id), entry.amountPaid]));

test("fills the oldest installment first, then spills into the last one", () => {
  const result = allocatePayment(schedule(3), 1800);
  assert.deepEqual(touched(result), { 1: 1000, 3: 800 });
  assert.deepEqual(
    result.allocations.map((entry) => entry.settled),
    [true, false],
  );
  assert.equal(result.outstandingAfter, 1200);
  assert.equal(result.surplus, 0);
  assert.equal(result.closesLoan, false);
});

test("once the last installment is full the excess continues forward from the second", () => {
  const result = allocatePayment(schedule(3), 2500);
  assert.deepEqual(touched(result), { 1: 1000, 3: 1000, 2: 500 });
  assert.equal(result.outstandingAfter, 500);
  assert.equal(result.closesLoan, false);
});

test("order across four installments is oldest, last, then the rest ascending", () => {
  const result = allocatePayment(schedule(4), 3500);
  assert.deepEqual(
    result.allocations.map((entry) => Number(entry.id)),
    [1, 4, 2, 3],
  );
  assert.deepEqual(touched(result), { 1: 1000, 4: 1000, 2: 1000, 3: 500 });
  assert.equal(result.outstandingAfter, 500);
});

test("any amount is accepted - there is no per-installment minimum", () => {
  const result = allocatePayment(schedule(3), 1);
  assert.deepEqual(touched(result), { 1: 1 });
  assert.equal(result.allocations[0].settled, false);
  assert.equal(result.outstandingAfter, 2999);
});

test("overpaying past the final installment settles everything and leaves a surplus", () => {
  const result = allocatePayment(schedule(3), 5000);
  assert.equal(result.allocations.length, 3);
  assert.ok(result.allocations.every((entry) => entry.settled));
  assert.equal(result.surplus, 2000);
  assert.equal(result.outstandingAfter, 0);
  assert.equal(result.closesLoan, true);
});

test("a single installment is the oldest and the last at once, and is only filled once", () => {
  const result = allocatePayment(schedule(1), 2500);
  assert.equal(result.allocations.length, 1);
  assert.deepEqual(touched(result), { 1: 1000 });
  assert.equal(result.surplus, 1500);
  assert.equal(result.closesLoan, true);
});

test("a partially paid installment is filled by its remainder, not its full amountDue", () => {
  const partial = schedule(3);
  partial[0] = { ...partial[0], amountPaid: 300 };

  const result = allocatePayment(partial, 900);
  assert.deepEqual(touched(result), { 1: 1000, 3: 200 });
  assert.equal(result.allocations[0].settled, true);
  assert.equal(result.outstandingAfter, 1800);
});

test("closes the loan when nothing is left unsettled", () => {
  const result = allocatePayment([], 500);
  assert.deepEqual(result.allocations, []);
  assert.equal(result.surplus, 500);
  assert.equal(result.outstandingAfter, 0);
  assert.equal(result.closesLoan, true);
});

test("caller ordering is not trusted - targets are chosen by seq", () => {
  const shuffled = [schedule(3)[2], schedule(3)[0], schedule(3)[1]];
  assert.deepEqual(allocatePayment(shuffled, 1800), allocatePayment(schedule(3), 1800));
});

test("a non-positive amount moves no money", () => {
  for (const amount of [0, -1, -5000]) {
    const result = allocatePayment(schedule(3), amount);
    assert.deepEqual(result.allocations, []);
    assert.equal(result.surplus, 0);
    assert.equal(result.outstandingAfter, 3000);
  }
});

test("allocated baht plus surplus always equals the payment exactly", () => {
  const cases = [
    [3, 1000, 1800],
    [3, 1000, 2500],
    [4, 1000, 3500],
    [1, 1, 1],
    [5, 333, 1000],
    [3, 1000, 5000],
    [7, 1429, 4],
  ] as const;

  for (const [count, amountDue, payment] of cases) {
    const installments = schedule(count, amountDue);
    const result = allocatePayment(installments, payment);
    const allocated = result.allocations.reduce((sum, entry) => {
      const before = installments.find((row) => row.id === entry.id);
      assert.ok(before);
      return sum + (entry.amountPaid - before.amountPaid);
    }, 0);

    assert.equal(allocated + result.surplus, payment);
    assert.equal(result.outstandingAfter, count * amountDue - allocated);
  }
});
