import {
  AdminDecisionError,
  decideAdminLoanRequest,
} from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminAccess } from "@/lib/loan-auth";
import { isLoanId, parseAdminDecisionInput } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

type Params = { params: Promise<{ id: string }> };

/**
 * Decide a loan request awaiting Admin approval.
 * @tag Admin loans
 * @pathParams LoanRequestIdParams
 * @body AdminDecisionBody
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

  let input;
  try {
    input = parseAdminDecisionInput(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  try {
    const loan = await decideAdminLoanRequest({
      id,
      adminId: access.context.user.id,
      decision: input.decision,
      approvedAmount: input.approvedAmount,
      comment: input.comment,
    });
    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof AdminDecisionError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof AdminDecisionError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    if (error instanceof AdminDecisionError && error.code === "ACCESS_REVOKED") {
      return apiError("CONFLICT", "The request changed; please retry", 409);
    }
    if (error instanceof AdminDecisionError && error.code === "INVALID_APPROVED_AMOUNT") {
      return apiError("VALIDATION_ERROR", "approvedAmount is invalid", 422);
    }
    if (error instanceof AdminDecisionError && error.code === "AMOUNT_EXCEEDS_REQUEST") {
      return apiError(
        "VALIDATION_ERROR",
        "approvedAmount cannot exceed the requested amount",
        422,
      );
    }
    if (error instanceof AdminDecisionError && error.code === "REDUCTION_COMMENT_REQUIRED") {
      return apiError(
        "VALIDATION_ERROR",
        "A comment is required when reducing the approved amount",
        422,
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    console.error("Unable to decide Admin loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to decide loan request", 500);
  }
}
