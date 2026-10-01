import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getDevelopmentHomePath,
  isDevelopmentApiBypass,
  isDevelopmentEnvironment,
} from "@/lib/development-access";
import { canTriggerReviewerNotification } from "@/lib/notification-access";

// Every argument is explicit ("" is unset), so a DEBUG_MODE exported in the shell cannot change
// the result: an undefined argument would fall back to process.env.
test("isDevelopmentEnvironment is true under next dev or DEBUG_MODE, and never reads INFISICAL_ENV", () => {
  assert.equal(isDevelopmentEnvironment("development", ""), true);
  assert.equal(isDevelopmentEnvironment("production", ""), false);
  assert.equal(isDevelopmentEnvironment("production", "true"), true);
  assert.equal(isDevelopmentEnvironment("production", "false"), false);
  assert.equal(isDevelopmentEnvironment("", ""), false);
  // The bypass needs its own flag on top, so DEBUG_MODE alone opens nothing.
  assert.equal(isDevelopmentApiBypass("", "development", ""), false);
  assert.equal(isDevelopmentApiBypass("true", "development", ""), true);
  assert.equal(isDevelopmentApiBypass("true", "production", ""), false);
  assert.equal(isDevelopmentApiBypass("true", "production", "true"), true);
  assert.equal(isDevelopmentApiBypass("", "production", "true"), false);
});

test("getDevelopmentHomePath picks the highest enabled DEV_AS_* role, else the student page", () => {
  const debug = { NODE_ENV: "production", DEBUG_MODE: "true" };
  assert.equal(getDevelopmentHomePath({ ...debug, DEV_AS_ADVISOR: "true" }), "/advisor");
  assert.equal(
    getDevelopmentHomePath({ ...debug, DEV_AS_ADVISOR: "true", DEV_AS_ADMIN: "true" }),
    "/admin",
  );
  assert.equal(
    getDevelopmentHomePath({ ...debug, DEV_AS_EXECUTIVE: "true", DEV_AS_SUPERADMIN: "true" }),
    "/superadmin",
  );
  assert.equal(getDevelopmentHomePath({ ...debug, DEV_API_BYPASS: "true" }), "/student");
  assert.equal(getDevelopmentHomePath({ ...debug, DEV_AS_ADMIN: "false" }), null);
  // Flags without DEBUG_MODE on a production build, or in a test run, send nobody anywhere.
  assert.equal(
    getDevelopmentHomePath({ NODE_ENV: "production", DEV_AS_ADVISOR: "true", DEV_API_BYPASS: "true" }),
    null,
  );
  assert.equal(getDevelopmentHomePath({ NODE_ENV: "development", DEV_AS_ADVISOR: "true" }), "/advisor");
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
