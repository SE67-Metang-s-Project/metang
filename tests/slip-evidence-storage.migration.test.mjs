import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260911160000_slip_evidence_storage/migration.sql"),
  "utf8",
);

test("slip evidence storage migration is wrapped in a transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("slip evidence storage migration renames columns instead of dropping and re-adding", () => {
  // A RENAME COLUMN preserves existing slip data; a DROP+ADD pair would silently lose it.
  assert.match(migration, /ALTER TABLE "public"\."payment" RENAME COLUMN "slip_url" TO "slip_path";/);
  assert.match(
    migration,
    /ALTER TABLE "public"\."fund_transaction" RENAME COLUMN "slip_url" TO "slip_path";/,
  );
  assert.doesNotMatch(migration, /DROP COLUMN "slip_url"/);
  assert.doesNotMatch(migration, /ADD COLUMN "slip_path"/);
});
