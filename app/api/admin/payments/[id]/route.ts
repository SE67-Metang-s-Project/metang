import { getAdminPaymentDetail } from "@/db/queries/payment-review";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdminAccess } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Get a single repayment slip submission for Admin/SuperAdmin review.
 * @description `id` is the payment id - the `id` field of a payment, not its `installmentId`.
 * @tag Admin payments
 * @pathParams PaymentIdParams
 * @auth cookieAuth
 * @response 200:AdminPaymentDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  const { id } = await params;
  // 422, not 404: a payment response carries id, installmentId and installment.id, and reaching for
  // the wrong one is the easy mistake. The caller is already an authorized admin who can list every
  // payment, so naming the expected shape leaks nothing and saves a debugging round trip.
  if (!isUuid(id)) {
    return apiError("VALIDATION_ERROR", "id must be a payment uuid, not an installment id", 422);
  }

  try {
    const payment = await getAdminPaymentDetail(id);
    if (!payment) return apiError("NOT_FOUND", "Payment not found", 404);
    return apiOk(serializeJson(payment));
  } catch (error) {
    console.error("Unable to get payment", error);
    return apiError("INTERNAL_ERROR", "Unable to get payment", 500);
  }
}
