import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("VerifySlipCard displays paid amount / total installment amount in installment & due date column", () => {
  const content = read("components/shared/verify-slip/VerifySlipCard.tsx");

  // Verify that the table cell renders the summary of paidAmount / baseAmount
  assert.match(
    content,
    /\{formatAmount\(inst\.paidAmount\)\}\s*\/\s*\{formatAmount\(inst\.baseAmount\)\}/,
    "VerifySlipCard must render paidAmount / baseAmount in the installment column",
  );

  // Verify that it is in the same cell as installment number and due date
  assert.match(
    content,
    /งวดที่\s*\{inst\.installmentNumber\}[\s\S]*?\{inst\.dateString\}[\s\S]*?\{formatAmount\(inst\.paidAmount\)\}\s*\/\s*\{formatAmount\(inst\.baseAmount\)\}/,
    "VerifySlipCard must display งวดที่, กำหนดชำระ, and ยอดชำระ/ยอดทั้งหมด in the same cell",
  );

  // Verify that only verified slips are counted into paidAmount
  assert.match(
    content,
    /installment\.evidences\.forEach\(\(evidence\) => \{[\s\S]*?if \(evidence\.status === "verified"\) \{[\s\S]*?verifiedPaidSum \+= verifiedAmt;/,
    "VerifySlipCard must only accumulate verified slips in verifiedPaidSum",
  );
  // Verify that advancePaidByInstallment is distributed starting from the last installment upwards
  assert.match(
    content,
    /for\s*\(\s*let i = lastInstallmentIndex;\s*i >= 0 && totalExcess > 0;\s*i--\s*\)/,
    "VerifySlipCard must distribute totalExcess starting from last installment and moving upwards",
  );

  // Verify that paidAmount is calculated taking advancePaid into account and capped at baseAmount
  assert.match(
    content,
    /calculatedPaid\s*=\s*Math\.min\(\s*installment\.baseAmount,\s*Math\.min\(verifiedPaidSum,\s*installment\.baseAmount\)\s*\+\s*advancePaid,\s*\)/,
    "VerifySlipCard must calculate paidAmount adding advancePaid and capping at baseAmount",
  );
});

test("VerifySlipCard deducts overpayment and applies to the last installment, and spills upwards if full", () => {
  const content = read("components/shared/verify-slip/VerifySlipCard.tsx");

  // Verify that totalExcess sums up verified overpayments across installments
  assert.match(
    content,
    /totalExcess\s*=\s*schedule\.reduce\([\s\S]*?Math\.max\(0,\s*verifiedAmount\s*-\s*installment\.baseAmount\)/,
    "VerifySlipCard must calculate totalExcess from overpayments",
  );

  // Verify that excess starts at lastInstallmentIndex and moves upwards
  assert.match(
    content,
    /for\s*\(\s*let i = lastInstallmentIndex;\s*i >= 0 && totalExcess > 0;\s*i--\s*\)/,
    "VerifySlipCard must iterate backwards from lastInstallmentIndex",
  );

  // Verify that remainingAmount for each installment is reduced by advancePaid
  assert.match(
    content,
    /remainingAmount\s*=\s*Math\.max\(0,\s*installment\.baseAmount\s*-\s*advancePaid\)/,
    "VerifySlipCard must deduct advancePaid from remainingAmount",
  );
});

test("VerifySlipCard renders summary row at the end with total verified paid and total requested amounts", () => {
  const content = read("components/shared/verify-slip/VerifySlipCard.tsx");

  // Verify that tfoot exists
  assert.match(content, /<tfoot>[\s\S]*?<\/tfoot>/, "VerifySlipCard must have a tfoot element");

  // Verify totalRequestedAmount and totalVerifiedPaidAmount calculations exist
  assert.match(
    content,
    /const totalRequestedAmount =/,
    "VerifySlipCard must calculate totalRequestedAmount",
  );
  assert.match(
    content,
    /const totalVerifiedPaidAmount =/,
    "VerifySlipCard must calculate totalVerifiedPaidAmount",
  );

  // Verify tfoot renders รวมทั้งสิ้น with totalVerifiedPaidAmount / totalRequestedAmount
  assert.match(
    content,
    /<tfoot>[\s\S]*?รวมทั้งสิ้น[\s\S]*?\{formatAmount\(totalVerifiedPaidAmount\)\}\s*\/\s*\{formatAmount\(totalRequestedAmount\)\}/,
    "VerifySlipCard tfoot must render รวมทั้งสิ้น and totalVerifiedPaid / totalRequested",
  );

  // Verify tfoot renders totalRequestedAmount in ยอดเรียกเก็บ and totalVerifiedPaidAmount in ยอดที่ชำระ
  assert.match(
    content,
    /<tfoot>[\s\S]*?\{formatAmount\(totalRequestedAmount\)\}[\s\S]*?\{formatAmount\(totalVerifiedPaidAmount\)\}/,
    "VerifySlipCard tfoot must render total requested in billed column and total verified in paid column",
  );
});

test("overpayment calculation logic transforms 4,041 / 3,000 into 3,000 / 3,000 and 1,041 / 3,000 on final installment", () => {
  const totalAmount = 6000;
  const termsCount = 2;
  const baseAmount = Math.floor(totalAmount / termsCount);
  const schedule = [
    { installmentNumber: 1, baseAmount, evidences: [{ amount: "4041", status: "verified" }] },
    { installmentNumber: 2, baseAmount, evidences: [] },
  ];
  const lastInstallmentIndex = schedule.length - 1;
  const selfPaidByInstallment = schedule.map((inst) => {
    const verified = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return Math.min(verified, inst.baseAmount);
  });
  let totalExcess = schedule.reduce((total, inst) => {
    const verified = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return total + Math.max(0, verified - inst.baseAmount);
  }, 0);

  assert.equal(totalExcess, 1041);

  const advancePaidByInstallment = Array(schedule.length).fill(0);
  for (let i = lastInstallmentIndex; i >= 0 && totalExcess > 0; i--) {
    const needed = Math.max(0, schedule[i].baseAmount - selfPaidByInstallment[i]);
    if (needed > 0) {
      const applied = Math.min(needed, totalExcess);
      advancePaidByInstallment[i] += applied;
      totalExcess -= applied;
    }
  }

  const results = schedule.map((inst, index) => {
    const advancePaid = advancePaidByInstallment[index];
    const verifiedPaidSum = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const paidAmount = Math.min(
      inst.baseAmount,
      Math.min(verifiedPaidSum, inst.baseAmount) + advancePaid,
    );
    return {
      paidAmount,
      baseAmount: inst.baseAmount,
      display: `${paidAmount} / ${inst.baseAmount}`,
    };
  });

  assert.equal(results[0].display, "3000 / 3000");
  assert.equal(results[1].display, "1041 / 3000");
});

test("when the last installment is full, overpayment shifts upwards progressively", () => {
  // 3-installment loan of 3,000 each (total 9,000), installment 1 is paid 7,500
  const totalAmount = 9000;
  const termsCount = 3;
  const baseAmount = Math.floor(totalAmount / termsCount);
  const schedule = [
    { installmentNumber: 1, baseAmount, evidences: [{ amount: "7500", status: "verified" }] },
    { installmentNumber: 2, baseAmount, evidences: [] },
    { installmentNumber: 3, baseAmount, evidences: [] },
  ];
  const lastInstallmentIndex = schedule.length - 1;
  const selfPaidByInstallment = schedule.map((inst) => {
    const verified = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return Math.min(verified, inst.baseAmount);
  });
  let totalExcess = schedule.reduce((total, inst) => {
    const verified = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return total + Math.max(0, verified - inst.baseAmount);
  }, 0);

  assert.equal(totalExcess, 4500);

  const advancePaidByInstallment = Array(schedule.length).fill(0);
  for (let i = lastInstallmentIndex; i >= 0 && totalExcess > 0; i--) {
    const needed = Math.max(0, schedule[i].baseAmount - selfPaidByInstallment[i]);
    if (needed > 0) {
      const applied = Math.min(needed, totalExcess);
      advancePaidByInstallment[i] += applied;
      totalExcess -= applied;
    }
  }

  // Installment 3 is full (3000), remainder 1500 shifts up to Installment 2
  assert.equal(advancePaidByInstallment[2], 3000);
  assert.equal(advancePaidByInstallment[1], 1500);
  assert.equal(advancePaidByInstallment[0], 0);

  const results = schedule.map((inst, index) => {
    const advancePaid = advancePaidByInstallment[index];
    const verifiedPaidSum = inst.evidences
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const paidAmount = Math.min(
      inst.baseAmount,
      Math.min(verifiedPaidSum, inst.baseAmount) + advancePaid,
    );
    return {
      paidAmount,
      baseAmount: inst.baseAmount,
      display: `${paidAmount} / ${inst.baseAmount}`,
    };
  });

  assert.equal(results[0].display, "3000 / 3000");
  assert.equal(results[1].display, "1500 / 3000");
  assert.equal(results[2].display, "3000 / 3000");
});

