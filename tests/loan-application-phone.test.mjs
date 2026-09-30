import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const form = readFileSync(
  resolve(root, "components/student/application/TempLoanApplicationPage.tsx"),
  "utf8",
);

test("the loan payload carries the phone number the student typed", () => {
  assert.match(form, /const phoneIsValid = \/\^0\(\?:\[689\]\\d\{8\}\|\[23457\]\\d\{7\}\)\$\/\.test\(cleanedPhone\);/);
  assert.match(form, /\.\.\.\(phoneIsValid \? \{ phoneNumber: cleanedPhone \} : \{\}\),/);
});

test("the form does not post the phone to /api/student/phone-number before the loan exists", () => {
  // The route needs an open loan, so for a first loan it answered 409 and the phone was lost.
  assert.doesNotMatch(form, /api\/student\/phone-number/);
});
