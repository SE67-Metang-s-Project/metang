import { getNextDueInstallmentContext } from "@/db/queries/notification-recipients";
import { apiError, apiOk } from "@/lib/api-response";
import { EmailApiError, sendEmail } from "@/lib/email-api";
import { buildLoanDueReminderEmail } from "@/lib/email-api/loan-reminder-template";
import { getAdminAccess } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";
import { buildStudentLoanDetailUrl } from "@/lib/student-deeplink";

/**
 * Outlook (email) due-date reminder to the student for a loan's next unpaid installment - which
 * installment, its amount due, and its due date are all computed from the database; the caller
 * supplies only loanId.
 * @tag Notifications
 * @body LoanReminderBody
 * @auth cookieAuth
 * @response 200:LoanReminderResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  let loanId: string;
  try {
    const body = await request.json();
    loanId = typeof body?.loanId === "string" ? body.loanId.trim() : "";
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON", 422);
  }
  if (!isLoanId(loanId)) return apiError("NOT_FOUND", "Loan request not found", 404);

  const installment = await getNextDueInstallmentContext(loanId);
  if (!installment) {
    return apiError("NOT_FOUND", "No outstanding installment for this loan", 404);
  }

  if (installment.loan.status !== "disbursed") {
    return apiError("CONFLICT", "The loan is not currently disbursed", 409);
  }
  const amountRemaining = installment.amountDue - installment.amountPaid;
  if (amountRemaining <= 0) {
    return apiError("CONFLICT", "This installment has no remaining balance", 409);
  }

  let payload;
  try {
    payload = buildLoanDueReminderEmail({
      studentName: installment.loan.student.fullNameTh,
      studentEmail: installment.loan.student.email,
      installmentSeq: installment.seq,
      amountDue: amountRemaining,
      dueDate: installment.dueDate,
      loanId: installment.loanId,
      loanDetailUrl: buildStudentLoanDetailUrl(process.env.APP_BASE_URL ?? "http://localhost:8080"),
    });
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Unable to build reminder email",
      422,
    );
  }

  try {
    await sendEmail(payload);
  } catch (error) {
    console.error("Unable to send loan reminder email", error);
    // EmailApiError's message is the provider's own error text (lib/email-api/client.ts) -
    // safe to return, unlike a raw thrown value, which could be anything.
    const message = error instanceof EmailApiError ? error.message : "Unable to send reminder email";
    return apiError("INTERNAL_ERROR", message, 500);
  }

  return apiOk(
    serializeJson({
      loanId: installment.loanId,
      installmentSeq: installment.seq,
      amountDue: amountRemaining,
      dueDate: installment.dueDate,
      sentTo: installment.loan.student.email,
    }),
  );
}
