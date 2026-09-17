import test from "node:test";
import assert from "node:assert/strict";
import { classifyDeliveryFailure } from "../lib/notifications/delivery-outcome";
import { EmailApiError } from "../lib/email-api/types";

// These tests are for the pure branch-selection/dedupe logic.
// Full integration coverage would require a live DB and email API sandbox.

test('classifyDeliveryFailure returns "retryable" for EmailApiError with status undefined or >= 500 or 408/429', () => {
  assert.equal(classifyDeliveryFailure(new EmailApiError("Network issue", undefined)), "retryable");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Server error", 502)), "retryable");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Internal Server Error", 500)), "retryable");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Request Timeout", 408)), "retryable");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Too Many Requests", 429)), "retryable");
});

test('classifyDeliveryFailure returns "permanent" for EmailApiError with status 4xx', () => {
  assert.equal(classifyDeliveryFailure(new EmailApiError("Bad request", 400)), "permanent");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Unauthorized", 401)), "permanent");
  assert.equal(classifyDeliveryFailure(new EmailApiError("Not found", 404)), "permanent");
});

test('classifyDeliveryFailure returns "permanent" for plain Error without status', () => {
  assert.equal(classifyDeliveryFailure(new Error("Validation failure")), "permanent");
  assert.equal(classifyDeliveryFailure("some string error"), "permanent");
});
