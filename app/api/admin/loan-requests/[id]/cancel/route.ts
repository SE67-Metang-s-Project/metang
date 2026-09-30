import { AdminCancelError, cancelAdminLoanRequest } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminAccess } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

type Params = { params: Promise<{ id: string }> };

/**
 * Cancel a loan request awaiting Admin decision or disbursement.
 * @tag Admin loans
 * @pathParams LoanRequestIdParams
 * @body AdminCancelBody
 * @auth cookieAuth
 * @response 200:AdminLoanRequestDetailResponse
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

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid request body", 422);
  }

  const rawComment = body?.comment ?? body?.reason;
  const comment = typeof rawComment === "string" ? rawComment.trim() : "";

  if (!comment) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุเหตุผลในการยกเลิกคำร้อง", 422);
  }

  if (comment.length > 500) {
    return apiError("VALIDATION_ERROR", "เหตุผลต้องมีความยาวไม่เกิน 500 ตัวอักษร", 422);
  }

  try {
    const loan = await cancelAdminLoanRequest({
      id,
      adminId: access.context.user.id,
      comment,
    });

    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof AdminCancelError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof AdminCancelError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    if (error instanceof AdminCancelError && error.code === "ACCESS_REVOKED") {
      return apiError("FORBIDDEN", "Admin access required", 403);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    console.error("Unable to cancel Admin loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to cancel loan request", 500);
  }
}
