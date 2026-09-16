import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("RequestsCard calculateInstallments uses floor division and puts remainder in the last installment", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");

  // Verify Math.floor is used for baseAmount
  assert.match(
    requestsCard,
    /const baseAmount = Math\.floor\(totalAmount \/ termsCount\);/,
    "RequestsCard must use Math.floor(totalAmount / termsCount) for integer split",
  );

  // Verify remainder is placed in the last installment
  assert.match(
    requestsCard,
    /const isLast = i === termsCount - 1;/,
    "RequestsCard must check for last installment",
  );
  assert.match(
    requestsCard,
    /isLast \? totalAmount - baseAmount \* \(termsCount - 1\) : baseAmount/,
    "RequestsCard must put remainder in the last installment",
  );

  // Now test the exact algorithm logic
  function calculateTestInstallments(termStr: string, amountStr: string) {
    const termsCount = parseInt(termStr, 10) || 0;
    const totalAmount = parseFloat(String(amountStr).replace(/,/g, "")) || 0;
    if (termsCount === 0) return [];
    const baseAmount = Math.floor(totalAmount / termsCount);
    return Array.from({ length: termsCount }, (_, i) => {
      const isLast = i === termsCount - 1;
      return isLast ? totalAmount - baseAmount * (termsCount - 1) : baseAmount;
    });
  }

  // 1,000 baht over 3 installments => [333, 333, 334]
  const amounts1000 = calculateTestInstallments("3", "1000");
  assert.deepEqual(amounts1000, [333, 333, 334]);
  assert.equal(amounts1000.reduce((a, b) => a + b, 0), 1000);
  amounts1000.forEach((amt) => assert.ok(Number.isInteger(amt)));

  // 100 baht over 3 installments => [33, 33, 34]
  const amounts100 = calculateTestInstallments("3", "100");
  assert.deepEqual(amounts100, [33, 33, 34]);
  assert.equal(amounts100.reduce((a, b) => a + b, 0), 100);

  // 5,000 baht over 3 installments => [1666, 1666, 1668]
  const amounts5000 = calculateTestInstallments("3", "5,000");
  assert.deepEqual(amounts5000, [1666, 1666, 1668]);
  assert.equal(amounts5000.reduce((a, b) => a + b, 0), 5000);

  // 3,000 baht over 3 installments => [1000, 1000, 1000]
  const amounts3000 = calculateTestInstallments("3", "3000");
  assert.deepEqual(amounts3000, [1000, 1000, 1000]);

  // 500 baht over 1 installment => [500]
  const amounts500 = calculateTestInstallments("1", "500");
  assert.deepEqual(amounts500, [500]);

  // 10,000 baht over 3 installments => [3333, 3333, 3334]
  const amounts10000 = calculateTestInstallments("3", "10,000");
  assert.deepEqual(amounts10000, [3333, 3333, 3334]);
  assert.equal(amounts10000.reduce((a, b) => a + b, 0), 10000);
});
