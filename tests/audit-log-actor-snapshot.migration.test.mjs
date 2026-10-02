import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const migration = read("db/migrations/20261002130000_audit_log_actor_snapshot/migration.sql");

test("actor snapshot migration is wrapped in a transaction", () => {
  assert.match(migration, /^-- .*\n[\s\S]*BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("audit_log keeps actor_id and gains actor_name and actor_role", () => {
  assert.match(migration, /ADD COLUMN "actor_name" TEXT,\s*ADD COLUMN "actor_role" TEXT;/);
  assert.doesNotMatch(migration, /DROP COLUMN/);
  const model = read("db/schema.prisma").match(/model AuditLog \{[^}]*\}/)[0];
  assert.match(model, /actorId +String\? +@map\("actor_id"\)/);
  assert.match(model, /actorName +String\? +@map\("actor_name"\)/);
  assert.match(model, /actorRole +String\? +@map\("actor_role"\)/);
});

test("a BEFORE INSERT trigger fills the snapshot from app_user/user_role or the student's loan", () => {
  assert.match(migration, /BEFORE INSERT ON "public"\."audit_log"\s+FOR EACH ROW EXECUTE FUNCTION "public"\."audit_log_snapshot_actor"\(\)/);
  assert.match(migration, /string_agg\(r\."role"::text, ',' ORDER BY r\."role"\)/);
  assert.match(migration, /NEW\."actor_role" := 'student';/);
});

test("the backfill opens the append-only hatch for this transaction only", () => {
  assert.match(migration, /SET LOCAL methang\.allow_audit_mutation = 'on';[\s\S]*UPDATE "public"\."audit_log"/);
});
