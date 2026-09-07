import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

 test("review-loop migration preflights legacy attempts before additive DDL", () => {
  const migration = read("db/migrations/20260904120000_admin_executive_review_loop/migration.sql");
  assert.match(migration, /^BEGIN;/);
  assert.match(migration, /executive\.step = 'executive'/);
  assert.match(migration, /admin\.attempt = executive\.attempt/);
  assert.match(migration, /admin\.decision = 'approved'/);
  assert.match(migration, /active Executive loans have no effective Admin owner/);
  assert.match(migration, /ADD COLUMN "assigned_admin_id" UUID/);
  assert.match(migration, /ADD COLUMN "created_at" TIMESTAMPTZ\(6\)/);
  assert.match(migration, /COMMIT;\s*$/);
});

 test("review-loop migration backfills only active Executive work", () => {
  const migration = read("db/migrations/20260904120000_admin_executive_review_loop/migration.sql");
  assert.match(migration, /loan\."status" = 'pending_executive'/);
  assert.match(migration, /executive\."decision" = 'pending'/);
  assert.match(migration, /CREATE INDEX "loan_request_assigned_admin_idx"/);
  assert.match(migration, /loan_request_assigned_admin_id_fkey/);
});

test("review-loop migration removes obsolete notification persistence", () => {
  const migration = read("db/migrations/20260904120000_admin_executive_review_loop/migration.sql");
  assert.match(migration, /DROP TABLE IF EXISTS "public"\."notification_outbox"/);
  assert.match(migration, /DROP TYPE IF EXISTS "public"\."notification_status"/);
});
