import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk, apiError } from "@/lib/api-response";
import {
  INSTALLMENT_REMINDER_EVENT,
  claimDueNotifications,
  markDelivered,
  markFailed,
  markSkipped,
} from "@/db/queries/notifications";
import { getInstallmentReminderContextById } from "@/db/queries/notification-recipients";
import { buildLoanDueReminderEmail } from "@/lib/email-api/loan-reminder-template";
import { sendEmail } from "@/lib/email-api/client";
import { classifyDeliveryFailure } from "@/lib/notifications/delivery-outcome";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";
import { serializeJson } from "@/lib/serialization";
import { parseReminderRow, decideDelivery } from "@/lib/notifications/delivery-decision";

export const maxDuration = 60;

async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  let loanDetailUrl: string;
  try {
    loanDetailUrl = buildStudentLoanDetailUrl(process.env.APP_BASE_URL ?? "http://localhost:8080");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError("INTERNAL_ERROR", message, 500);
  }

  // Smaller batch to ensure completion within maxDuration
  const rows = await claimDueNotifications(20, INSTALLMENT_REMINDER_EVENT);
  let processed = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        processed++;

        const parsed = parseReminderRow({ eventType: row.eventType, payload: row.payload });
        if (parsed.kind === "fail") {
          await markFailed(row.id, parsed.message, { permanent: true });
          failed++;
          return;
        }

        const installment = await getInstallmentReminderContextById(parsed.installmentId);
        const decision = decideDelivery(installment);

        if (decision.kind === "skip") {
          await markSkipped(row.id, decision.reason);
          skipped++;
          return;
        }

        const { installment: due } = decision;
        let emailPayload;
        try {
          emailPayload = buildLoanDueReminderEmail({
            studentName: due.loan.student.fullNameTh,
            studentEmail: due.loan.student.email,
            installmentSeq: due.seq,
            amountDue: decision.amountRemaining,
            dueDate: due.dueDate,
            loanId: due.loanId,
            loanDetailUrl,
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
          const outcome = classifyDeliveryFailure(error);
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
