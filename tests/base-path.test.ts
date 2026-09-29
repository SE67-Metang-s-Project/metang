import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_PATH, resolveBasePath, withBasePath } from "../lib/base-path";

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

test("PUBLIC_SUBPATH sets the base path, and an empty value serves from the root", () => {
  assert.equal(resolveBasePath(undefined), "/metang");
  assert.equal(resolveBasePath("/loan"), "/loan");
  assert.equal(resolveBasePath("/nursing/loan"), "/nursing/loan");
  assert.equal(resolveBasePath(""), "");
});

test("PUBLIC_SUBPATH is tidied to a leading slash and no trailing slash", () => {
  assert.equal(resolveBasePath("metang"), "/metang");
  assert.equal(resolveBasePath("/loan/"), "/loan");
  assert.equal(resolveBasePath(" loan "), "/loan");
  assert.equal(resolveBasePath("nursing/loan"), "/nursing/loan");
  assert.equal(resolveBasePath("/"), "");
});
