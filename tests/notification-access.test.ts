import assert from "node:assert/strict";
import { test } from "node:test";
import { isDevelopmentEnvironment } from "@/lib/development-access";
import { canTriggerReviewerNotification } from "@/lib/notification-access";

test("isDevelopmentEnvironment checks both environments", () => {
  assert.equal(isDevelopmentEnvironment("dev", "development"), true);
  assert.equal(isDevelopmentEnvironment("prod", "production"), false);
  assert.equal(isDevelopmentEnvironment("dev", "production"), false);
  assert.equal(isDevelopmentEnvironment("prod", "development"), false);
  assert.equal(isDevelopmentEnvironment(undefined, undefined), false);
});

test("canTriggerReviewerNotification authorizes correctly by role", () => {
  const myLoan = { studentId: "s1", advisorId: "a1" };
  const otherLoan = { studentId: "s2", advisorId: "a2" };

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
