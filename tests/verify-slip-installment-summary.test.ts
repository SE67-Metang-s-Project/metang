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
  assert.match(
    content,
    /if \(installment\.evidences\.length > 0\) \{\s*\/\/[^\n]*\s*installment\.paidAmount = verifiedPaidSum;/,
    "VerifySlipCard must set installment.paidAmount to verifiedPaidSum when slips are present",
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

