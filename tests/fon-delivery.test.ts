import test from "node:test";
import assert from "node:assert/strict";
import {
  isReviewerNotificationPayload,
  parseReviewerRow,
  decideReviewerDelivery,
  REVIEWER_NOTIFICATION_EVENT,
} from "../lib/notifications/fon-delivery-decision";
import { classifyStatusFailure } from "../lib/notifications/delivery-outcome";

test("isReviewerNotificationPayload", async (t) => {
  await t.test("valid payload", () => {
    assert.equal(
      isReviewerNotificationPayload({
        loanId: "l-1",
        status: "pending_advisor",
        role: "advisor",
        recipientEmail: "adv@example.com",
      }),
      true,
    );
  });

  await t.test("null", () => {
    assert.equal(isReviewerNotificationPayload(null), false);
  });

  await t.test("string", () => {
    assert.equal(isReviewerNotificationPayload("foo"), false);
  });

  await t.test("missing fields", () => {
    const valid = {
      loanId: "l-1",
      status: "pending_advisor",
      role: "advisor",
      recipientEmail: "adv@example.com",
    };
    for (const key of Object.keys(valid) as (keyof typeof valid)[]) {
      const copy = { ...valid };
      delete copy[key];
      assert.equal(isReviewerNotificationPayload(copy), false, `missing ${key}`);
    }
  });

  await t.test("empty strings", () => {
    const valid = {
      loanId: "l-1",
      status: "pending_advisor",
      role: "advisor",
      recipientEmail: "adv@example.com",
    };
    for (const key of Object.keys(valid) as (keyof typeof valid)[]) {
      const copy = { ...valid, [key]: "" };
      assert.equal(isReviewerNotificationPayload(copy), false, `empty ${key}`);
    }
  });

  await t.test("non-string fields", () => {
    const valid = {
      loanId: "l-1",
      status: "pending_advisor",
      role: "advisor",
      recipientEmail: "adv@example.com",
    };
    for (const key of Object.keys(valid) as (keyof typeof valid)[]) {
      const copy = { ...valid, [key]: 123 };
      assert.equal(isReviewerNotificationPayload(copy), false, `non-string ${key}`);
    }
  });
});

test("parseReviewerRow", async (t) => {
  await t.test("wrong eventType", () => {
    const result = parseReviewerRow({ eventType: "other", payload: {} });
    assert.deepEqual(result, { kind: "fail", message: "unsupported eventType: other" });
  });

  await t.test("malformed payload", () => {
    const result = parseReviewerRow({ eventType: REVIEWER_NOTIFICATION_EVENT, payload: { a: 1 } });
    assert.deepEqual(result, { kind: "fail", message: "malformed payload" });
  });

  await t.test("valid row returns payload", () => {
    const payload = {
      loanId: "l-1",
      status: "pending_advisor",
      role: "advisor",
      recipientEmail: "a@b.com",
    };
    const result = parseReviewerRow({ eventType: REVIEWER_NOTIFICATION_EVENT, payload });
    assert.deepEqual(result, { kind: "ok", payload });
  });
});

test("decideReviewerDelivery", async (t) => {
  await t.test("loan gone", () => {
    assert.deepEqual(
      decideReviewerDelivery({
        enqueuedStatus: "pending_advisor",
        currentStatus: null,
        recipientStillValid: true,
      }),
      { kind: "skip", reason: "loan no longer exists" },
    );
  });

  await t.test("status moved on", () => {
    assert.deepEqual(
      decideReviewerDelivery({
        enqueuedStatus: "pending_advisor",
        currentStatus: "pending_admin",
        recipientStillValid: true,
      }),
      { kind: "skip", reason: "loan moved on (enqueued at pending_advisor, now pending_admin)" },
    );
  });

  await t.test("recipient no longer valid", () => {
    assert.deepEqual(
      decideReviewerDelivery({
        enqueuedStatus: "pending_advisor",
        currentStatus: "pending_advisor",
        recipientStillValid: false,
      }),
      { kind: "skip", reason: "recipient no longer holds the reviewer role" },
    );
  });

  await t.test("happy path", () => {
    assert.deepEqual(
      decideReviewerDelivery({
        enqueuedStatus: "pending_advisor",
        currentStatus: "pending_advisor",
        recipientStillValid: true,
      }),
      { kind: "send" },
    );
  });
});

test("classifyStatusFailure", async (t) => {
  await t.test("retryable statuses", () => {
    const retryable = [undefined, 500, 502, 503, 408, 429];
    for (const status of retryable) {
      assert.equal(classifyStatusFailure(status), "retryable", `status ${status}`);
    }
  });

  await t.test("permanent statuses", () => {
    const permanent = [400, 401, 403, 404];
    for (const status of permanent) {
      assert.equal(classifyStatusFailure(status), "permanent", `status ${status}`);
    }
  });
});
