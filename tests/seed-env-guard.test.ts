import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");

// The guard throws before the seed opens a connection, so the remote host is never contacted.
const seed = (env: Record<string, string>) => {
  const base = { ...process.env };
  delete base.INFISICAL_ENV;
  return spawnSync("npx", ["tsx", "db/seed.ts", "--reset"], {
    cwd: root,
    env: { ...base, ...env },
    encoding: "utf8",
  });
};

test("db/seed.ts refuses a remote database unless INFISICAL_ENV=dev", () => {
  const result = seed({ DATABASE_URL: "postgresql://x:x@db.example.com:5432/x" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to seed db\.example\.com/);

  const prod = seed({ DATABASE_URL: "postgresql://x:x@db.example.com:5432/x", INFISICAL_ENV: "prod" });
  assert.notEqual(prod.status, 0);
  assert.match(prod.stderr, /Refusing to seed/);
});
