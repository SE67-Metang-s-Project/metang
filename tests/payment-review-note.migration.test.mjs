import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260922150000_payment_review_note/migration.sql"),
  "utf8",
);

/** Executable SQL only - the comments discuss the columns asserted absent below. */
const statements = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

test("payment review note migration is wrapped in a transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("adds a nullable review_note and nothing else", () => {
  assert.match(statements, /ALTER TABLE "public"\."payment" ADD COLUMN "review_note" TEXT;/);
  // Nullable: a confirmation need not carry a note, and every existing row predates the column.
  assert.doesNotMatch(statements, /"review_note" TEXT NOT NULL/);

  // confirmedBy/confirmedAt are reused as "who reviewed / when" for both outcomes, so no second
  // near-identical pair of columns is introduced.
  assert.doesNotMatch(statements, /reviewed_by/);
  assert.doesNotMatch(statements, /reviewed_at/);
});

test("the migration drops nothing", () => {
  assert.doesNotMatch(statements, /DROP COLUMN/);
  assert.doesNotMatch(statements, /DROP TABLE/);
  assert.doesNotMatch(statements, /DROP INDEX/);
});

test("the schema exposes the column the app writes", () => {
  const schema = readFileSync(resolve(root, "db/schema.prisma"), "utf8");
  assert.match(schema, /reviewNote\s+String\?\s+@map\("review_note"\) @db\.Text/);
});
