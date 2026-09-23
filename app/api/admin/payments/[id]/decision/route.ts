import { decidePayment, PaymentDecisionError } from "@/db/queries/payment-review";
import { PaymentApplicationError } from "@/db/queries/payments";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminAccess } from "@/lib/loan-auth";
import { isUuid, parsePaymentDecisionInput } from "@/lib/loan-validation";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Confirm or reject a repayment slip awaiting review. A confirmation applies the money to the
 * loan's installments and credits the fund in the same transaction.
 * @description `id` is the payment id - the `id` field of a payment, not its `installmentId`. The payment amount is not editable: it is read from the stored submission, never from this body. Rejecting requires a note, which is shown to the student so they can submit a corrected slip.
 * @tag Admin payments
 * @pathParams PaymentIdParams
 * @body PaymentDecisionBody
 * @auth cookieAuth
 * @response 200:AdminPaymentDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request, { params }: Params) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  let input;
  try {
    input = parsePaymentDecisionInput(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError("VALIDATION_ERROR", "id must be a payment uuid, not an installment id", 422);
  }

  try {
    const payment = await decidePayment({
      paymentId: id,
      adminId: access.context.user.id,
      decision: input.decision,
      note: input.note,
    });
    return apiOk(serializeJson(payment));
  } catch (error) {
    if (error instanceof PaymentDecisionError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Payment not found", 404);
    }
    if (error instanceof PaymentDecisionError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The payment was already reviewed", 409);
    }
    if (error instanceof PaymentDecisionError && error.code === "ACCESS_REVOKED") {
      return apiError("CONFLICT", "The request changed; please retry", 409);
    }
    // Raised while applying a confirmation - the money side, from db/queries/payments.ts.
    if (error instanceof PaymentApplicationError && error.code === "LOAN_NOT_DISBURSED") {
      return apiError("CONFLICT", "The loan is not open for repayment", 409);
    }
    if (error instanceof PaymentApplicationError && error.code === "DUPLICATE_REPAYMENT") {
      return apiError("CONFLICT", "The payment was already credited to the fund", 409);
    }
    if (error instanceof PaymentApplicationError) {
      return apiError("CONFLICT", "The request changed; please retry", 409);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return apiError("CONFLICT", "The payment was already reviewed", 409);
    }
    console.error("Unable to decide payment", error);
    return apiError("INTERNAL_ERROR", "Unable to decide payment", 500);
  }
}
