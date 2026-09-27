import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260927130000_loan_request_id_cycle/migration.sql"),
  "utf8",
);

/** Executable SQL only - the header comment mentions NO CYCLE and the dropped range check. */
const statements = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

test("loan request ID cycle migration is wrapped in a transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("the loan request suffix wraps from 9999 back to 0000", () => {
  assert.match(statements, /ALTER SEQUENCE "public"\."loan_request_number_seq" CYCLE;/);
  assert.doesNotMatch(statements, /NO CYCLE/);
});

test("next_loan_request_id keeps the REQ + Bangkok date + 4-digit shape without the dead range check", () => {
  assert.match(statements, /CREATE OR REPLACE FUNCTION "public"\."next_loan_request_id"\(\)/);
  assert.match(statements, /to_char\(current_timestamp AT TIME ZONE 'Asia\/Bangkok', 'YYYYMMDD'\)/);
  assert.match(statements, /lpad\(nextval\('public\.loan_request_number_seq'\)::text, 4, '0'\)/);
  assert.doesNotMatch(statements, /9999|RAISE EXCEPTION/);
});

test("the migration drops nothing", () => {
  assert.doesNotMatch(statements, /DROP /);
});
