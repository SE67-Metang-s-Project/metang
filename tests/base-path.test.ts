import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_PATH, withBasePath } from "../lib/base-path";

test("withBasePath prefixes app-root paths", () => {
  assert.equal(BASE_PATH, "/metang");
  assert.equal(withBasePath("/api/student/payments"), "/metang/api/student/payments");
  assert.equal(withBasePath("/"), "/metang/");
});

test("withBasePath leaves paths that already have the base path", () => {
  assert.equal(withBasePath("/metang"), "/metang");
  assert.equal(withBasePath("/metang/api/x"), "/metang/api/x");
  assert.equal(withBasePath("/metangx"), "/metang/metangx");
});

test("withBasePath rejects relative paths", () => {
  assert.throws(() => withBasePath("api/x"));
});
