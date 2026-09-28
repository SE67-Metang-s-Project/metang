import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeReturnPath } from "../lib/return-path";

// Pure logic only - the validator guards every post-login redirect against open redirects.

test("same-site deep links from notifications are accepted unchanged", () => {
  assert.equal(
    sanitizeReturnPath("/admin/pending?requestId=REQ1"),
    "/admin/pending?requestId=REQ1",
  );
  assert.equal(
    sanitizeReturnPath("/student/detail?request=REQ1"),
    "/student/detail?request=REQ1",
  );
  assert.equal(sanitizeReturnPath("/admin"), "/admin");
});

test("the fragment is dropped, since it never reaches the server", () => {
  assert.equal(
    sanitizeReturnPath("/student/detail?request=REQ1#top"),
    "/student/detail?request=REQ1",
  );
});

test("protocol-relative and backslash paths are rejected", () => {
  assert.equal(sanitizeReturnPath("//evil.com"), null);
  assert.equal(sanitizeReturnPath("/\\evil.com"), null);
  assert.equal(sanitizeReturnPath("/admin\\..\\evil"), null);
});

test("absolute URLs and other schemes are rejected", () => {
  assert.equal(sanitizeReturnPath("https://evil.com"), null);
  assert.equal(sanitizeReturnPath("http://localhost/admin"), null);
  assert.equal(sanitizeReturnPath("javascript:alert(1)"), null);
  assert.equal(sanitizeReturnPath("admin/pending"), null);
});

test("API and login targets are rejected, including after path normalization", () => {
  assert.equal(sanitizeReturnPath("/api/auth/login"), null);
  assert.equal(sanitizeReturnPath("/api"), null);
  assert.equal(sanitizeReturnPath("/API/auth/login"), null);
  assert.equal(sanitizeReturnPath("/login"), null);
  assert.equal(sanitizeReturnPath("/login?next=/x"), null);
  assert.equal(sanitizeReturnPath("/admin/../api/auth/login"), null);
  assert.equal(sanitizeReturnPath("/%2e%2e/login"), null);
  assert.equal(sanitizeReturnPath("/%61pi/auth/login"), null);
  // Only whole segments are blocked.
  assert.equal(sanitizeReturnPath("/api-docs"), "/api-docs");
});

test("empty, non-string, over-long and control-character values are rejected", () => {
  assert.equal(sanitizeReturnPath(""), null);
  assert.equal(sanitizeReturnPath(null), null);
  assert.equal(sanitizeReturnPath(undefined), null);
  assert.equal(sanitizeReturnPath(42), null);
  assert.equal(sanitizeReturnPath(`/admin?x=${"a".repeat(2048)}`), null);
  assert.equal(sanitizeReturnPath("/admin\r\nSet-Cookie: x=1"), null);
  assert.equal(sanitizeReturnPath("/\t/evil.com"), null);
  assert.equal(sanitizeReturnPath("/admin\u0000"), null);
});

test("a value that only grows past the limit once percent-encoded is rejected", () => {
  assert.equal(sanitizeReturnPath(`/student?name=${"ก".repeat(1000)}`), null);
});
