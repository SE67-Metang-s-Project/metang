import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("RequestsCard enforces loan amount adjustment limit (downward only, <= requested, > 0)", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");

  // canEditAmount is only for admin and super_admin
  assert.match(
    requestsCard,
    /const canEditAmount = userRole === "admin" \|\| userRole === "super_admin";/,
    "Only admin and super_admin can edit amount",
  );

  // originalRequestedAmount is tracked
  assert.match(
    requestsCard,
    /originalRequestedAmount/,
    "Must track originalRequestedAmount state",
  );

  // handleSaveAmount validates against exceeding requested amount
  assert.match(
    requestsCard,
    /num > originalRequestedAmount/,
    "handleSaveAmount must validate num > originalRequestedAmount",
  );
  assert.match(
    requestsCard,
    /ไม่สามารถปรับวงเงินมากกว่าที่ขอได้/,
    "Must display error message when amount exceeds requested amount",
  );

  // handleSaveAmount validates positive amount
  assert.match(
    requestsCard,
    /กรุณาระบุวงเงินที่มากกว่า 0 บาท/,
    "Must display error message when amount is zero or negative",
  );

  // HTML input specifies min and max
  assert.match(
    requestsCard,
    /max=\{originalRequestedAmount/,
    "Input element must have max bound to originalRequestedAmount",
  );

  // handleConfirmDecision validates approvedAmount before submission
  assert.match(
    requestsCard,
    /parsed > originalRequestedAmount/,
    "handleConfirmDecision must validate parsed > originalRequestedAmount",
  );

  // Shows reduced amount indicator when amount is lowered
  assert.match(
    requestsCard,
    /ปรับลดจาก/,
    "Must show reduction indicator when loan amount is lowered",
  );
});

test("Backend loan-requests query enforces approvedAmount <= current.amount and > 0", () => {
  const queryFile = read("db/queries/loan-requests.ts");

  // Rejects if approvedAmount > current.amount
  assert.match(
    queryFile,
    /approvedAmount > current\.amount/,
    "Backend must reject if approvedAmount exceeds current requested amount",
  );
  assert.match(
    queryFile,
    /AMOUNT_EXCEEDS_REQUEST/,
    "Backend must throw AMOUNT_EXCEEDS_REQUEST error",
  );

  // Rejects if approvedAmount <= 0
  assert.match(
    queryFile,
    /approvedAmount <= 0/,
    "Backend must reject non-positive approvedAmount",
  );

  // Requires comment when amount is reduced
  assert.match(
    queryFile,
    /REDUCTION_COMMENT_REQUIRED/,
    "Backend must require comment when amount is reduced",
  );
});
