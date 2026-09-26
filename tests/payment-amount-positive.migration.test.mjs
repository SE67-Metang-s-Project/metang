import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260927120000_payment_amount_positive/migration.sql"),
  "utf8",
);

/** Executable SQL only - the header comment names the parser and other writers. */
const statements = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

test("payment amount migration is wrapped in a transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("the database refuses a zero or negative payment amount", () => {
  // Same name shape as fund_transaction_amount_positive, the ledger's matching rule.
  assert.match(
    statements,
    /ALTER TABLE "public"\."payment"\s+ADD CONSTRAINT "payment_amount_positive" CHECK \("amount" > 0\);/,
  );
  // Validated, not NOT VALID: every existing row came through parseStudentPaymentInput.
  assert.doesNotMatch(statements, /NOT VALID/);
});

test("the migration drops nothing", () => {
  assert.doesNotMatch(statements, /DROP /);
});
