import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("student POST reports open-loan conflict only for the student_id constraint", () => {
  const route = read("app/api/student/loan-requests/route.ts");

  assert.match(route, /isUniqueConstraintOnField\(error, "student_id"\)/);
  assert.match(route, /error\.code === "P2034"/);
  assert.doesNotMatch(route, /error\.code === "P2002" \|\| error\.code === "P2034"/);
});
