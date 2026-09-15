import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FON_PROGRAM_NAME,
  REVIEWER_NOTIFICATION_COLOR,
  REVIEWER_STEP_BY_STATUS,
  buildReviewerNotificationPayload,
} from "@/lib/line-notification-template";
import {
  REVIEWER_REQUEST_PATHS,
  buildReviewerRequestPath,
  buildReviewerRequestUrl,
  buildRequestUrlForPath,
} from "@/lib/reviewer-deeplink";

test("REVIEWER_STEP_BY_STATUS covers exactly the 3 review-chain statuses this sprint owns", () => {
  assert.equal(REVIEWER_STEP_BY_STATUS.pending_advisor?.role, "advisor");
  assert.equal(REVIEWER_STEP_BY_STATUS.pending_admin?.role, "admin");
  assert.equal(REVIEWER_STEP_BY_STATUS.pending_executive?.role, "executive");
});

test("REVIEWER_STEP_BY_STATUS has no entry for terminal or non-reviewer statuses", () => {
  for (const status of ["draft", "returned", "disbursed", "closed", "rejected", "cancelled"] as const) {
    assert.equal(REVIEWER_STEP_BY_STATUS[status], undefined, `${status} must have no reviewer step`);
  }
});

test("pending_disbursement has a reviewer step defined but is out of this sprint's producer scope", () => {
  // Still present in the shared map (used by /api/notifications/fon), just not one of the 3
  // statuses notifyLoanReviewer's callers fire on this sprint - see tests/workflow.test.mjs's
  // wiring assertions for what IS wired.
  assert.equal(REVIEWER_STEP_BY_STATUS.pending_disbursement?.role, "admin");
  assert.equal(REVIEWER_STEP_BY_STATUS.pending_disbursement?.path, "/admin/disburse-debt");
});

test("buildReviewerNotificationPayload composes program, message, weblink, and role color", () => {
  const payload = buildReviewerNotificationPayload({
    role: "advisor",
    recipientEmail: "advisor@cmu.ac.th",
    requestId: "REQ202609060001",
    studentName: "สมชาย ใจดี",
    amount: 30000,
    eventLabel: "มีคำร้องใหม่รอการตรวจสอบ",
    deepLinkUrl: "https://example.com/advisor/pending?requestId=REQ202609060001",
  });

  assert.equal(payload.program, FON_PROGRAM_NAME);
  assert.equal(payload.email, "advisor@cmu.ac.th");
  assert.equal(payload.weblink, "https://example.com/advisor/pending?requestId=REQ202609060001");
  assert.equal(payload.color, REVIEWER_NOTIFICATION_COLOR.advisor);
  assert.match(payload.message, /มีคำร้องใหม่รอการตรวจสอบ/);
  assert.match(payload.message, /REQ202609060001/);
  assert.match(payload.message, /สมชาย ใจดี/);
  assert.match(payload.message, /30,000 บาท/);
});

test("buildReviewerNotificationPayload uses a distinct color per reviewer role", () => {
  const colors = new Set(Object.values(REVIEWER_NOTIFICATION_COLOR));
  // admin and super_admin intentionally share a color (both are the "admin" review step);
  // advisor and executive must each be visually distinct from that and each other.
  assert.equal(REVIEWER_NOTIFICATION_COLOR.admin, REVIEWER_NOTIFICATION_COLOR.super_admin);
  assert.notEqual(REVIEWER_NOTIFICATION_COLOR.advisor, REVIEWER_NOTIFICATION_COLOR.admin);
  assert.notEqual(REVIEWER_NOTIFICATION_COLOR.executive, REVIEWER_NOTIFICATION_COLOR.admin);
  assert.ok(colors.size >= 3);
});

test("buildReviewerRequestPath builds the role's default queue path with an encoded requestId", () => {
  assert.equal(
    buildReviewerRequestPath("advisor", "REQ 001"),
    `${REVIEWER_REQUEST_PATHS.advisor}?requestId=REQ%20001`,
  );
  assert.equal(
    buildReviewerRequestPath("executive", "REQ202609060001"),
    "/executive/pending-executive?requestId=REQ202609060001",
  );
});

test("buildReviewerRequestPath rejects an empty requestId", () => {
  assert.throws(() => buildReviewerRequestPath("advisor", ""), /requestId is required/);
  assert.throws(() => buildReviewerRequestPath("advisor", "   "), /requestId is required/);
});

test("buildReviewerRequestUrl and buildRequestUrlForPath reject a non-HTTP(S) base URL", () => {
  assert.throws(
    () => buildReviewerRequestUrl("ftp://example.com", "advisor", "REQ-1"),
    /APP_BASE_URL must use HTTP or HTTPS/,
  );
  assert.throws(
    () => buildRequestUrlForPath("not a url", "/admin/pending", "REQ-1"),
    /APP_BASE_URL must be a valid URL/,
  );
});

test("buildRequestUrlForPath builds an absolute URL for a path that differs from the role default", () => {
  // pending_disbursement routes Admin to the disbursement queue, not /admin/pending - the whole
  // reason buildRequestUrlForPath exists instead of always deriving the path from role.
  const url = buildRequestUrlForPath("https://example.com", "/admin/disburse-debt", "REQ-1");
  assert.equal(url, "https://example.com/admin/disburse-debt?requestId=REQ-1");
});
