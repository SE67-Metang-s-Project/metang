import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(
  resolve(root, "db/migrations/20260922130000_system_setting/migration.sql"),
  "utf8",
);

test("system_setting migration creates the table with the 8 editable columns", () => {
  assert.match(migration, /CREATE TABLE "system_setting"/);
  assert.match(migration, /"id" SMALLINT NOT NULL DEFAULT 1/);
  assert.match(migration, /"bank_name" TEXT NOT NULL/);
  assert.match(migration, /"account_name" TEXT NOT NULL/);
  assert.match(migration, /"account_number" TEXT NOT NULL/);
  assert.match(migration, /"contact_location_th" TEXT NOT NULL/);
  assert.match(migration, /"contact_location_en" TEXT,/);
  assert.match(migration, /"contact_phone" TEXT NOT NULL/);
  assert.match(migration, /"contact_ext" TEXT,/);
  assert.match(migration, /"contact_email" TEXT NOT NULL/);
  assert.match(migration, /CONSTRAINT "system_setting_pkey" PRIMARY KEY \("id"\)/);
});

test("system_setting migration adds a nullable, SET NULL foreign key to app_user", () => {
  assert.match(migration, /"updated_by_id" UUID,/);
  assert.match(
    migration,
    /ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_updated_by_id_fkey"\s+FOREIGN KEY \("updated_by_id"\) REFERENCES "app_user"\("id"\) ON DELETE SET NULL ON UPDATE NO ACTION;/,
  );
});

test("system_setting migration enforces a singleton row with a CHECK constraint", () => {
  assert.match(
    migration,
    /ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_singleton" CHECK \("id" = 1\);/,
  );
});

test("system_setting migration seeds the fixture row idempotently", () => {
  const insertIndex = migration.indexOf('INSERT INTO "system_setting"');
  assert.ok(insertIndex > -1);
  const seed = migration.slice(insertIndex);
  assert.match(seed, /'ธนาคารกรุงไทย'/);
  assert.match(seed, /'521-0-12345-6'/);
  assert.match(seed, /'053-935025'/);
  assert.match(seed, /'loan@nurse\.cmu\.ac\.th'/);
  assert.match(seed, /ON CONFLICT \("id"\) DO NOTHING;/);
});
