import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const migration = read("db/migrations/20261001160000_immutable_audit_log/migration.sql");

test("immutable audit log migration is wrapped in a transaction", () => {
  assert.match(migration, /^-- .*\n[\s\S]*BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("audit_log keeps a deleted actor's rows: no FK to app_user", () => {
  assert.match(migration, /ALTER TABLE "public"\."audit_log" DROP CONSTRAINT "audit_log_actor_id_fkey";/);
  assert.doesNotMatch(read("db/schema.prisma"), /model AuditLog \{[^}]*@relation/);
});

test("audit_log is append-only, with the seed's session escape hatch", () => {
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "public"\."audit_log"/);
  assert.match(migration, /current_setting\('methang\.allow_audit_mutation', true\) = 'on'/);
  assert.match(migration, /RAISE EXCEPTION 'audit_log is append-only/);
  assert.match(read("db/seed.ts"), /SET LOCAL methang\.allow_audit_mutation = 'on'/);
});

test("audit_log blocks TRUNCATE too, and db:reset opens the hatch in a transaction", () => {
  assert.match(migration, /BEFORE TRUNCATE ON "public"\."audit_log"\s+FOR EACH STATEMENT/);
  const clear = read("db/clear.ts");
  assert.match(clear, /prisma\.\$transaction\(\[\s*prisma\.\$executeRaw`SET LOCAL methang\.allow_audit_mutation = 'on'`,\s*prisma\.\$executeRaw`\s*TRUNCATE TABLE/);
});

test("deleting a granter clears user_role.granted_by", () => {
  assert.match(migration, /REFERENCES "public"\."app_user"\("id"\) ON DELETE SET NULL/);
  assert.match(read("db/schema.prisma"), /"GrantedRoles", fields: \[grantedBy\], references: \[id\], onDelete: SetNull/);
});

test("no query updates or deletes audit rows", () => {
  for (const file of readdirSync(resolve(root, "db/queries"))) {
    assert.doesNotMatch(read(`db/queries/${file}`), /auditLog\.(update|delete|upsert)/, file);
  }
});
