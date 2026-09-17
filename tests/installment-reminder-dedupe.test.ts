import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInstallmentReminderDedupeKey,
  isInstallmentReminderPayload,
} from "../lib/notifications/installment-reminder";

// These tests run with --conditions=react-server to avoid server-only import issues
// from transitively imported prisma modules. No real DB connection is used.

test("buildInstallmentReminderDedupeKey produces correct strings", () => {
  assert.equal(
    buildInstallmentReminderDedupeKey("123", "2026-09-16", 0),
    "installment-reminder:123:2026-09-16:0",
  );
  assert.equal(
    buildInstallmentReminderDedupeKey(BigInt(456), "2026-09-19", 3),
    "installment-reminder:456:2026-09-19:3",
  );
});

test("isInstallmentReminderPayload validates payload objects", () => {
  assert.equal(isInstallmentReminderPayload({ loanId: "L1", installmentId: "I1" }), true);
  
  assert.equal(isInstallmentReminderPayload(null), false);
  assert.equal(isInstallmentReminderPayload("string"), false);
  assert.equal(isInstallmentReminderPayload({ loanId: "L1" }), false);
  assert.equal(isInstallmentReminderPayload({ installmentId: "I1" }), false);
  assert.equal(isInstallmentReminderPayload({ loanId: 123, installmentId: "I1" }), false);
  assert.equal(isInstallmentReminderPayload({ loanId: "L1", installmentId: 123 }), false);
});
