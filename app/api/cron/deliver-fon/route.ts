import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk, apiError } from "@/lib/api-response";
import {
  REVIEWER_NOTIFICATION_EVENT,
  claimDueNotifications,
  markDelivered,
  markFailed,
  markSkipped,
} from "@/db/queries/notifications";
import {
  getLoanNotificationContext,
  resolveReviewerRecipients,
} from "@/db/queries/notification-recipients";
import { buildRequestUrlForPath } from "@/lib/reviewer-deeplink";
import {
  buildReviewerNotificationPayload,
  REVIEWER_STEP_BY_STATUS,
} from "@/lib/line-notification-template";
import { sendLineNotification, LineNotificationError } from "@/lib/line-notification";
import { classifyStatusFailure } from "@/lib/notifications/delivery-outcome";
import { serializeJson } from "@/lib/serialization";
import {
  decideReviewerDelivery,
  parseReviewerRow,
} from "@/lib/notifications/fon-delivery-decision";
import { type LoanStatus } from "@/lib/generated/prisma/client";

export const maxDuration = 60;

async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:8080";
  try {
    // Probe with throwaway arguments before claiming anything: buildRequestUrlForPath throws on a
    // bad base URL, and inside the row loop that would permanently fail every claimed row over
    // what is really one misconfigured environment variable.
    buildRequestUrlForPath(baseUrl, "/", "probe");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError("INTERNAL_ERROR", message, 500);
  }

  const rows = await claimDueNotifications(20, REVIEWER_NOTIFICATION_EVENT);
  let processed = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        processed++;

        const parsed = parseReviewerRow({ eventType: row.eventType, payload: row.payload });
        if (parsed.kind === "fail") {
          await markFailed(row.id, parsed.message, { permanent: true });
          failed++;
          return;
        }

        const payload = parsed.payload;

        const step = REVIEWER_STEP_BY_STATUS[payload.status as LoanStatus];
        if (!step) {
          await markSkipped(row.id, "no reviewer step for enqueued status");
          skipped++;
          return;
        }

        const loan = await getLoanNotificationContext(payload.loanId);
        if (!loan) {
          await markSkipped(row.id, "loan no longer exists");
          skipped++;
          return;
        }

        const recipients = await resolveReviewerRecipients(step.role, loan);
        const decision = decideReviewerDelivery({
          enqueuedStatus: payload.status,
          currentStatus: loan.status,
          recipientStillValid: recipients.includes(payload.recipientEmail),
        });

        if (decision.kind === "skip") {
          await markSkipped(row.id, decision.reason);
          skipped++;
          return;
        }

        const deepLinkUrl = buildRequestUrlForPath(baseUrl, step.path, payload.loanId);
        const messagePayload = buildReviewerNotificationPayload({
          role: step.role,
          recipientEmail: payload.recipientEmail,
          requestId: payload.loanId,
          studentName: loan.student.fullNameTh,
          amount: loan.approvedAmount ?? loan.amount,
          eventLabel: step.eventLabel,
          deepLinkUrl,
        });

        try {
          await sendLineNotification(messagePayload, { idempotencyKey: row.dedupeKey });
          await markDelivered(row.id);
          delivered++;
        } catch (error) {
          const outcome =
            error instanceof LineNotificationError
              ? classifyStatusFailure(error.status)
              : "permanent";
          const message = error instanceof Error ? error.message : String(error);

          if (outcome === "permanent") {
            await markFailed(row.id, message, { permanent: true });
          } else {
            await markFailed(row.id, message, {});
          }
          failed++;
        }
      })
    );
  }

  return apiOk(serializeJson({ processed, delivered, skipped, failed }));
}

export const GET = handle;
export const POST = handle;
