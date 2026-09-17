export const REVIEWER_NOTIFICATION_EVENT = "reviewer_notification" as const;

export type ReviewerRow = { eventType: string; payload: unknown };

export type ReviewerNotificationPayload = {
  loanId: string;
  status: string;
  role: string;
  recipientEmail: string;
};

export type ParsedReviewerRow =
  | { kind: "ok"; payload: ReviewerNotificationPayload }
  | { kind: "fail"; message: string };

export function isReviewerNotificationPayload(
  value: unknown,
): value is ReviewerNotificationPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.loanId === "string" && v.loanId.length > 0 &&
    typeof v.status === "string" && v.status.length > 0 &&
    typeof v.role === "string" && v.role.length > 0 &&
    typeof v.recipientEmail === "string" && v.recipientEmail.length > 0
  );
}

export function parseReviewerRow(row: ReviewerRow): ParsedReviewerRow {
  if (row.eventType !== REVIEWER_NOTIFICATION_EVENT) {
    return { kind: "fail", message: `unsupported eventType: ${row.eventType}` };
  }
  if (!isReviewerNotificationPayload(row.payload)) {
    return { kind: "fail", message: "malformed payload" };
  }
  return { kind: "ok", payload: row.payload };
}

export type ReviewerDeliveryDecision =
  | { kind: "send" }
  | { kind: "skip"; reason: string };

export function decideReviewerDelivery(input: {
  enqueuedStatus: string;
  currentStatus: string | null;
  recipientStillValid: boolean;
}): ReviewerDeliveryDecision {
  if (input.currentStatus === null) {
    return { kind: "skip", reason: "loan no longer exists" };
  }
  if (input.currentStatus !== input.enqueuedStatus) {
    return {
      kind: "skip",
      reason: `loan moved on (enqueued at ${input.enqueuedStatus}, now ${input.currentStatus})`,
    };
  }
  if (!input.recipientStillValid) {
    return { kind: "skip", reason: "recipient no longer holds the reviewer role" };
  }
  return { kind: "send" };
}
