import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260911120000_fund_ledger_invariants/migration.sql"),
  "utf8",
);

test("fund ledger migration is wrapped in a transaction", () => {
  assert.match(migration, /^-- .*\n[\s\S]*BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("fund ledger migration migrates legacy kind values before the enum type change", () => {
  const dataMigrationIndex = migration.indexOf('UPDATE "public"."fund_transaction"');
  const enumCreateIndex = migration.indexOf('CREATE TYPE "public"."fund_transaction_kind"');
  assert.ok(dataMigrationIndex > -1 && enumCreateIndex > -1);
  assert.ok(dataMigrationIndex < enumCreateIndex);
  assert.match(migration, /SET "kind" = 'disbursement' WHERE "kind" = 'disburse'/);
  assert.match(
    migration,
    /SET "kind" = 'credit_adjustment'\s+WHERE "kind" = 'adjustment' AND "direction" = 1/,
  );
  assert.match(
    migration,
    /SET "kind" = 'debit_adjustment'\s+WHERE "kind" = 'adjustment' AND "direction" = -1/,
  );
});

test("fund ledger migration adds the enums and the disburse-once index", () => {
  assert.match(
    migration,
    /CREATE TYPE "public"\.\"fund_transaction_kind" AS ENUM \(\s*'top_up',\s*'withdrawal',\s*'credit_adjustment',\s*'debit_adjustment',\s*'disbursement',\s*'repayment'\s*\);/,
  );
  assert.match(migration, /CREATE TYPE "public"\.\"payment_status" AS ENUM/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "fund_transaction_one_disbursement_per_loan"\s+ON "public"\.\"fund_transaction"\("loan_id"\)\s+WHERE "kind" = 'disbursement';/,
  );
});

test("fund ledger migration adds amount, direction, and kind/direction pairing CHECK constraints", () => {
  assert.match(migration, /CHECK \("amount" > 0\)/);
  assert.match(migration, /CHECK \("direction" IN \(-1, 1\)\)/);
  assert.match(migration, /fund_transaction_kind_direction_pairing/);
  assert.match(
    migration,
    /"kind" IN \('top_up', 'credit_adjustment', 'repayment'\) AND "direction" = 1/,
  );
  assert.match(
    migration,
    /"kind" IN \('withdrawal', 'debit_adjustment', 'disbursement'\) AND "direction" = -1/,
  );
});

test("fund ledger migration adds a balance guard and an append-only guard with a seed escape hatch", () => {
  assert.match(migration, /AFTER INSERT ON "public"\.\"fund_transaction"/);
  assert.match(migration, /fund_transaction: insufficient balance/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "public"\.\"fund_transaction"/);
  assert.match(migration, /current_setting\('methang\.allow_fund_mutation', true\) = 'on'/);
  assert.match(migration, /ponytail: full-table SUM per insert/);
});
