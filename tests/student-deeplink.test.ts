import test from "node:test";
import assert from "node:assert/strict";
import { buildStudentLoanDetailUrl } from "../lib/student-deeplink";

test("a student email link opens the loan it is about", () => {
  assert.equal(
    buildStudentLoanDetailUrl("https://metang.example", "REQ202609280001"),
    "https://metang.example/metang/student/detail?request=REQ202609280001",
  );
});

test("without a request id the link opens the current loan, as before", () => {
  assert.equal(
    buildStudentLoanDetailUrl("https://metang.example"),
    "https://metang.example/metang/student/detail",
  );
});

test("the link carries the base path, whether or not APP_BASE_URL already has it", () => {
  for (const baseUrl of [
    "https://metang.example",
    "https://metang.example/",
    "https://metang.example/metang",
    "https://metang.example/metang/",
  ]) {
    assert.equal(
      buildStudentLoanDetailUrl(baseUrl, "REQ1"),
      "https://metang.example/metang/student/detail?request=REQ1",
      baseUrl,
    );
  }
});

test("a bad APP_BASE_URL is refused", () => {
  assert.throws(
    () => buildStudentLoanDetailUrl("not a url", "REQ1"),
    /APP_BASE_URL must be a valid URL/,
  );
  assert.throws(
    () => buildStudentLoanDetailUrl("ftp://metang.example"),
    /APP_BASE_URL must use HTTP or HTTPS/,
  );
});
