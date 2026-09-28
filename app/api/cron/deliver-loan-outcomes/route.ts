import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk, apiError } from "@/lib/api-response";
import {
  LOAN_OUTCOME_EVENT,
  claimDueNotifications,
  markDelivered,
  markFailed,
  markSkipped,
} from "@/db/queries/notifications";
import { getLoanOutcomeContextById } from "@/db/queries/notification-recipients";
import { buildLoanOutcomeEmail } from "@/lib/email-api/loan-outcome-template";
import { sendEmail } from "@/lib/email-api/client";
import { classifyDeliveryFailure } from "@/lib/notifications/delivery-outcome";
import { decideLoanOutcomeDelivery, parseLoanOutcomeRow } from "@/lib/notifications/loan-outcome";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";
import { serializeJson } from "@/lib/serialization";

export const maxDuration = 60;

/**
 * Emails students that their loan was disbursed or their request was rejected. Students are
 * notified through the Outlook email API only - never FON, which stays reviewer-only.
 */
async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  // Probed before claiming, so a bad APP_BASE_URL fails the run instead of every claimed row.
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:8080";
  try {
    buildStudentLoanDetailUrl(baseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError("INTERNAL_ERROR", message, 500);
  }

  const rows = await claimDueNotifications(20, LOAN_OUTCOME_EVENT);
  let processed = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.allSettled(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        processed++;

        const parsed = parseLoanOutcomeRow({ eventType: row.eventType, payload: row.payload });
        if (parsed.kind === "fail") {
          await markFailed(row.id, parsed.message, { permanent: true });
          failed++;
          return;
        }

        const decision = decideLoanOutcomeDelivery(
          await getLoanOutcomeContextById(parsed.loanId),
          parsed.outcome,
        );
        if (decision.kind === "skip") {
          await markSkipped(row.id, decision.reason);
          skipped++;
          return;
        }

        const { loan } = decision;
        let emailPayload;
        try {
          const common = {
            studentName: loan.student.fullNameTh,
            studentEmail: loan.student.email,
            loanId: loan.id,
            loanDetailUrl: buildStudentLoanDetailUrl(baseUrl, loan.id),
          };
          if (parsed.outcome === "disbursed") {
            const first = loan.installments[0];
            if (!first || loan.approvedAmount === null) {
              throw new Error("disbursed loan has no approved amount or installment schedule");
            }
            emailPayload = buildLoanOutcomeEmail({
              ...common,
              outcome: "disbursed",
              amount: loan.approvedAmount,
              installmentCount: loan.installmentCount,
              firstDueDate: first.dueDate,
              firstInstallmentAmount: first.amountDue,
            });
          } else {
            const rejection = loan.approvals[0];
            emailPayload = buildLoanOutcomeEmail({
              ...common,
              outcome: "rejected",
              rejectedBy: rejection?.step ?? null,
              reason: rejection?.comment ?? null,
            });
          }
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
