import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk } from "@/lib/api-response";
import {
  claimDueNotifications,
  markDelivered,
  markFailed,
} from "@/db/queries/notifications";
import { getInstallmentReminderContextById } from "@/db/queries/notification-recipients";
import {
  INSTALLMENT_REMINDER_EVENT,
  isInstallmentReminderPayload,
} from "@/lib/notifications/installment-reminder";
import { buildLoanDueReminderEmail } from "@/lib/email-api/loan-reminder-template";
import { sendEmail } from "@/lib/email-api/client";
import { classifyDeliveryFailure } from "@/lib/notifications/delivery-outcome";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";
import { serializeJson } from "@/lib/serialization";

async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  const rows = await claimDueNotifications(50);
  let processed = 0;
  let delivered = 0;
  let failed = 0;

  await Promise.allSettled(
    rows.map(async (row) => {
      processed++;

      if (row.eventType !== INSTALLMENT_REMINDER_EVENT) {
        await markFailed(row.id, "unsupported eventType: " + row.eventType, { permanent: true });
        failed++;
        return;
      }

      if (!isInstallmentReminderPayload(row.payload)) {
        await markFailed(row.id, "malformed payload", { permanent: true });
        failed++;
        return;
      }

      const payload = row.payload;
      const installment = await getInstallmentReminderContextById(BigInt(payload.installmentId));

      if (!installment || installment.settledAt) {
        // Installment gone or already settled since this reminder was enqueued - nothing to send.
        await markDelivered(row.id);
        delivered++;
        return;
      }

      let emailPayload;
      try {
        emailPayload = buildLoanDueReminderEmail({
          studentName: installment.loan.student.fullNameTh,
          studentEmail: installment.loan.student.email,
          installmentSeq: installment.seq,
          amountDue: installment.amountDue - installment.amountPaid,
          dueDate: installment.dueDate,
          loanId: installment.loanId,
          loanDetailUrl: buildStudentLoanDetailUrl(process.env.APP_BASE_URL ?? "http://localhost:8080"),
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

  return apiOk(serializeJson({ processed, delivered, failed }));
}

export const GET = handle;
export const POST = handle;
