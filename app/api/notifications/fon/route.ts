import {
  getLoanNotificationContext,
  resolveReviewerRecipients,
  sendReviewerNotifications,
} from "@/db/queries/notification-recipients";
import { apiError, apiOk } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { LineNotificationError } from "@/lib/line-notification";
import { REVIEWER_STEP_BY_STATUS } from "@/lib/line-notification-template";
import { canTriggerReviewerNotification } from "@/lib/notification-access";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";

// ponytail: per-process cooldown, enough for a single Next server. Move to a shared store
// (Redis/Postgres) if this ever runs multi-instance - each instance gets its own window, so a
// student could get one free notification per instance behind a load balancer.
const COOLDOWN_MS = 60_000;
const lastNotifiedAt = new Map<string, number>();

function pruneCooldowns(now: number) {
  for (const [key, at] of lastNotifiedAt) {
    if (now - at > COOLDOWN_MS) lastNotifiedAt.delete(key);
  }
}

/**
 * FON (LINE) notification to the reviewer currently holding a loan request - the recipient,
 * role, deep link, and message content are all derived from the database, never from the
 * request body.
 * @tag Notifications
 * @body ReviewerNotificationBody
 * @auth cookieAuth
 * @response 200:ReviewerNotificationResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 429:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  let loanId: string;
  try {
    const body = await request.json();
    loanId = typeof body?.loanId === "string" ? body.loanId.trim() : "";
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON", 422);
  }
  if (!isLoanId(loanId)) return apiError("VALIDATION_ERROR", "loanId is invalid", 422);

  const loan = await getLoanNotificationContext(loanId);
  if (!loan) return apiError("NOT_FOUND", "Loan request not found", 404);

  const allowed = context.user.roles.some(({ role }) =>
    canTriggerReviewerNotification(role, context.user.id, loan),
  );
  if (!allowed) return apiError("FORBIDDEN", "Not allowed to notify reviewers for this loan", 403);

  const step = REVIEWER_STEP_BY_STATUS[loan.status];
  if (!step) {
    return apiError("CONFLICT", "The loan has no reviewer awaiting action", 409);
  }

  const cooldownKey = `${loan.id}:${loan.status}`;
  const now = Date.now();
  pruneCooldowns(now);
  const lastSentAt = lastNotifiedAt.get(cooldownKey);
  if (lastSentAt !== undefined && now - lastSentAt < COOLDOWN_MS) {
    return apiError(
      "RATE_LIMITED",
      "A notification for this step was already sent recently",
      429,
    );
  }

  let recipients: string[];
  try {
    recipients = await resolveReviewerRecipients(step.role, loan);
  } catch (error) {
    console.error("Unable to resolve reviewer recipients", error);
    return apiError("INTERNAL_ERROR", "Unable to resolve notification recipients", 500);
  }
  if (recipients.length === 0) {
    return apiError("CONFLICT", "No reviewer is available to notify for this loan", 409);
  }

  const results = await sendReviewerNotifications(step, loan, recipients);

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  if (sent === 0) {
    const firstFailure = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    const reason = firstFailure?.reason;
    console.error("Unable to send reviewer notification", reason);
    // LineNotificationError's message is either our own validation text or the provider's own
    // error field (lib/line-notification.ts extractApiErrorMessage) - both are safe to return,
    // unlike a raw thrown value, which could be anything.
    const message =
      reason instanceof LineNotificationError ? reason.message : "Unable to send reviewer notification";
    return apiError("INTERNAL_ERROR", message, 500);
  }

  lastNotifiedAt.set(cooldownKey, now);

  return apiOk(serializeJson({ loanId: loan.id, role: step.role, sent, failed }));
}
