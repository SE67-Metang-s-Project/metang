import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260922140000_repayment_ledger_link/migration.sql"),
  "utf8",
);

/** Executable SQL only - the file's comments discuss the very things asserted absent below. */
const statements = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

test("repayment ledger link migration is wrapped in a transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("adds a nullable payment_id with a foreign key to payment", () => {
  assert.match(migration, /ALTER TABLE "public"\."fund_transaction" ADD COLUMN "payment_id" UUID;/);
  assert.match(
    migration,
    /FOREIGN KEY \("payment_id"\) REFERENCES "public"\."payment"\("id"\)/,
  );
  // Nullable on purpose: every kind other than repayment leaves it empty, and the three legacy
  // seeded repayment rows predate the column.
  assert.doesNotMatch(migration, /"payment_id" UUID NOT NULL/);
});

test("one repayment per payment is enforced by a partial unique index", () => {
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "fund_transaction_one_repayment_per_payment"\s+ON "public"\."fund_transaction"\("payment_id"\)\s+WHERE "kind" = 'repayment';/,
  );
  // Scoped to payment_id, not loan_id: a loan legitimately repays many times, so reusing the
  // disburse-once shape would cap every loan at a single repayment.
  assert.doesNotMatch(migration, /fund_transaction_one_repayment_per_payment"\s+ON [^\n]*"loan_id"/);
});

test("the migration neither backfills nor drops anything", () => {
  // fund_transaction carries a BEFORE UPDATE OR DELETE append-only trigger; a backfill UPDATE
  // would be rejected unless it first set methang.allow_fund_mutation. db/seed.ts links the
  // legacy rows instead.
  assert.doesNotMatch(statements, /UPDATE "public"\."fund_transaction"/);
  assert.doesNotMatch(statements, /allow_fund_mutation/);
  assert.doesNotMatch(statements, /DROP COLUMN/);
  assert.doesNotMatch(statements, /DROP INDEX/);
});
