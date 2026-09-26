import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

const pendingTableLayout =
  /table-auto text-left border-collapse min-w-\[1050px\] max-\[1299px\]:min-w-\[1300px\]/;

test("disbursement and payment-slip tables match the pending-request table layout", () => {
  const disbursement = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  const verifySlip = read("components/shared/verify-slip/VerifySlipCard.tsx");

  for (const table of [disbursement, verifySlip]) {
    assert.match(table, pendingTableLayout);
    assert.match(table, /<col className="w-\[140px\]" \/>/);
    assert.match(table, /<col className="w-\[25%\]" \/>/);
    assert.match(table, /<col className="w-px" \/>/);
    assert.match(table, /วันที่-เวลายื่นคำร้อง/);
    assert.match(table, /วัตถุประสงค์การกู้ยืม/);
    assert.match(
      table,
      /\[request\.studentId, request\.major, request\.degree, `ปี \$\{request\.year\}`\]/,
      "Student details must match the advisor pending-request format",
    );
    assert.match(table, /formatStudentDetails\(req\)/);
  }

  assert.match(disbursement, />ดำเนินการ</);
  assert.match(verifySlip, />ตรวจสอบ</);
});
