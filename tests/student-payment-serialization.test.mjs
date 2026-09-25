import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const route = readFileSync(
  resolve(import.meta.dirname, "../app/api/student/payments/route.ts"),
  "utf8",
);

test("student payment retries a Serializable conflict before giving up", () => {
  assert.match(route, /error\.code === "P2034"/);
  assert.match(route, /attempt >= 3 \|\| !isSerializationFailure\(error\)/);
});

test("a conflict that survives the retries is a 409, not a 500", () => {
  assert.match(
    route,
    /if \(isSerializationFailure\(error\)\) \{\s*return apiError\("CONFLICT", "The request changed; please try again", 409\);/,
  );
  assert.ok(
    route.indexOf("isSerializationFailure(error)) {") < route.indexOf('"INTERNAL_ERROR", "Unable to submit repayment"'),
  );
});
