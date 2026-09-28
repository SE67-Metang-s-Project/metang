import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("/user lists every student, so its layout admits Admin and SuperAdmin only", () => {
  const layout = read("app/user/layout.tsx");
  assert.match(layout, /import \{ requireAdminAccess \} from "@\/lib\/loan-auth";/);
  assert.match(layout, /await requireAdminAccess\(\);/);

  // requireAdminAccess is the guard for both roles - nothing narrower, nothing wider.
  const loanAuth = read("lib/loan-auth.ts");
  assert.match(loanAuth, /role === "admin" \|\| role === "super_admin"/);
});

test("proxy forwards the /user path, so sign-in returns to it", () => {
  assert.match(read("proxy.ts"), /"\/user\/:path\*"/);
});
