import { getAdminPaymentQueue } from "@/db/queries/payment-review";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdminAccess } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

/**
 * List repayment slips awaiting Admin/SuperAdmin review, oldest first.
 * @tag Admin payments
 * @auth cookieAuth
 * @response 200:AdminPaymentQueueResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  try {
    return apiOk(serializeJson(await getAdminPaymentQueue()));
  } catch (error) {
    console.error("Unable to list payments awaiting review", error);
    return apiError("INTERNAL_ERROR", "Unable to list payments", 500);
  }
}
