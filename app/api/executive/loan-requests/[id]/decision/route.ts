import {
  decideExecutiveLoanRequest,
  ExecutiveDecisionError,
} from "@/db/queries/loan-requests";
import { Prisma } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getExecutiveAccess } from "@/lib/loan-auth";
import { isLoanId, parseExecutiveDecisionInput } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

type Params = { params: Promise<{ id: string }> };

/**
 * Submit the active Executive's final decision for a loan request.
 * @tag Executive loans
 * @pathParams LoanRequestIdParams
 * @body ExecutiveDecisionBody
 * @auth cookieAuth
 * @response 200:ExecutiveLoanRequestDetailResponse
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
  const access = await getExecutiveAccess();
  if (access.status === "unauthenticated") return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (access.status === "forbidden") return apiError("FORBIDDEN", "Executive access required", 403);

  let input;
  try {
    input = parseExecutiveDecisionInput(await request.json());
  } catch (error) {
    return apiError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid request", 422);
  }
  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  try {
    const loan = await decideExecutiveLoanRequest({
      id,
      executiveId: access.context.user.id,
      decision: input.decision,
      comment: input.comment,
    });
    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof ExecutiveDecisionError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof ExecutiveDecisionError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    if (error instanceof ExecutiveDecisionError && error.code === "MISSING_ADMIN_ASSIGNMENT") {
      return apiError("CONFLICT", "The request has no assigned Admin", 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    console.error("Unable to decide Executive loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to decide loan request", 500);
  }
}
