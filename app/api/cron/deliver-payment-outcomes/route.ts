import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk, apiError } from "@/lib/api-response";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  PAYMENT_OUTCOME_EVENT,
  claimDueNotifications,
  markDelivered,
  markFailed,
  markSkipped,
} from "@/db/queries/notifications";
import { getPaymentOutcomeContextById } from "@/db/queries/notification-recipients";
import { buildPaymentOutcomeEmail } from "@/lib/email-api/payment-outcome-template";
import { sendEmail } from "@/lib/email-api/client";
import { classifyDeliveryFailure } from "@/lib/notifications/delivery-outcome";
import {
  decidePaymentOutcomeDelivery,
  parsePaymentOutcomeRow,
} from "@/lib/notifications/payment-outcome";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";
import { serializeJson } from "@/lib/serialization";

export const maxDuration = 60;

/**
 * Emails students the outcome of an Admin's review of their repayment slip. Students are notified
 * through the Outlook email API only - never FON, which stays reviewer-only.
 */
async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  // Probed before claiming, so a bad APP_BASE_URL fails the run instead of every claimed row.
  let baseUrl: string;
  try {
    baseUrl = getAppBaseUrl();
    buildStudentLoanDetailUrl(baseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError("INTERNAL_ERROR", message, 500);
  }

  const rows = await claimDueNotifications(20, PAYMENT_OUTCOME_EVENT);
  let processed = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        processed++;

        const parsed = parsePaymentOutcomeRow({ eventType: row.eventType, payload: row.payload });
        if (parsed.kind === "fail") {
          await markFailed(row.id, parsed.message, { permanent: true });
          failed++;
          return;
        }

        const decision = decidePaymentOutcomeDelivery(
          await getPaymentOutcomeContextById(parsed.paymentId),
        );
        if (decision.kind === "skip") {
          await markSkipped(row.id, decision.reason);
          skipped++;
          return;
        }

        const { payment } = decision;
        let emailPayload;
        try {
          emailPayload = buildPaymentOutcomeEmail({
            outcome: decision.outcome,
            studentName: payment.loan.studentNameTh,
            studentEmail: payment.loan.studentEmail,
            amount: payment.amount,
            loanId: payment.loanId,
            reviewNote: payment.reviewNote,
            loanDetailUrl: buildStudentLoanDetailUrl(baseUrl, payment.loanId),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await markFailed(row.id, message, { permanent: true });
          failed++;
          return;
        }

        try {
          await sendEmail(emailPayload);
          await markDelivered(row.id);
          delivered++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await markFailed(row.id, message, {
            permanent: classifyDeliveryFailure(error) === "permanent",
          });
          failed++;
        }
      }),
    );
  }

  return apiOk(serializeJson({ processed, delivered, skipped, failed }));
}

export const GET = handle;
export const POST = handle;
