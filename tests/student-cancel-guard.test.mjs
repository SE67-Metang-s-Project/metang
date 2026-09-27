import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const route = readFileSync(
  resolve(root, "app/api/student/loan-requests/[id]/cancel/route.ts"),
  "utf8",
);

test("a loan awaiting disbursement can no longer be cancelled", () => {
  assert.match(route, /const terminalStatuses: LoanStatus\[\] = \[[^\]]*"pending_disbursement"[^\]]*\];/);
  // Both the pre-check and the compare-and-set use the same list.
  assert.match(route, /terminalStatuses\.includes\(current\.status\)/);
  assert.match(route, /status: \{ notIn: terminalStatuses \}/);
});

test("cancel refuses a cross-origin request before touching the session", () => {
  const originCheck = route.indexOf("if (!isSameOrigin(request))");
  const auth = route.indexOf("await getStudentContext()");
  assert.ok(originCheck > -1, "cancel must call isSameOrigin");
  assert.ok(originCheck < auth, "the origin check must run before authentication");
  assert.match(route, /"FORBIDDEN", "A same-origin request is required", 403/);
  assert.match(route, /@add 403:ApiErrorResponse/);
});
