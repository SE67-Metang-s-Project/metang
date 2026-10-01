import assert from "node:assert/strict";
import { test } from "node:test";
import { isDevelopmentApiBypass, isDevelopmentEnvironment } from "@/lib/development-access";
import { canTriggerReviewerNotification } from "@/lib/notification-access";

test("isDevelopmentEnvironment is true under next dev or DEBUG_MODE, and never reads INFISICAL_ENV", () => {
  assert.equal(isDevelopmentEnvironment("development", undefined), true);
  assert.equal(isDevelopmentEnvironment("production", undefined), false);
  assert.equal(isDevelopmentEnvironment("production", "true"), true);
  assert.equal(isDevelopmentEnvironment("production", "false"), false);
  assert.equal(isDevelopmentEnvironment(undefined, undefined), false);
  // The bypass needs its own flag on top, so DEBUG_MODE alone opens nothing.
  assert.equal(isDevelopmentApiBypass(undefined, "development"), false);
  assert.equal(isDevelopmentApiBypass("true", "development"), true);
  assert.equal(isDevelopmentApiBypass("true", "production"), false);
});

test("canTriggerReviewerNotification authorizes correctly by role", () => {
  const myLoan = { studentCode: "s1", advisorId: "a1" };
  const otherLoan = { studentCode: "s2", advisorId: "a2" };

  // admin, super_admin, executive can trigger on any loan
  assert.equal(canTriggerReviewerNotification("admin", "admin1", myLoan), true);
  assert.equal(canTriggerReviewerNotification("super_admin", "sadmin1", myLoan), true);
  assert.equal(canTriggerReviewerNotification("executive", "exec1", myLoan), true);

  // student can trigger only on their own loan
  assert.equal(canTriggerReviewerNotification("student", "s1", myLoan), true);
  assert.equal(canTriggerReviewerNotification("student", "s1", otherLoan), false);

  // advisor can trigger only on loan they advise
  assert.equal(canTriggerReviewerNotification("advisor", "a1", myLoan), true);
  assert.equal(canTriggerReviewerNotification("advisor", "a1", otherLoan), false);
});
