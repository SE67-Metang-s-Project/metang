import { AdvisorDecisionError, decideLoanRequest } from "@/db/queries/loan-requests";
import { Prisma } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdvisorContext } from "@/lib/loan-auth";
import { isUuid, parseLoanDecisionInput } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

type Params = { params: Promise<{ id: string }> };

/**
 * Decide an advisor-assigned loan request.
 * @tag Advisor loans
 * @pathParams LoanRequestIdParams
 * @body AdvisorDecisionBody
 * @auth cookieAuth
 * @response 200:AdvisorLoanRequestDetailResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request, { params }: Params) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;
  const context = await getAdvisorContext();
  if (!context) return apiError("NOT_FOUND", "Loan request not found", 404);

  let input;
  try {
    input = parseLoanDecisionInput(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  const { id } = await params;
  if (!isUuid(id)) return apiError("NOT_FOUND", "Loan request not found", 404);
  try {
    const loan = await decideLoanRequest({
      id,
      advisorId: context.user.id,
      decision: input.decision,
      comment: input.comment,
    });
    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof AdvisorDecisionError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof AdvisorDecisionError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return apiError("CONFLICT", "The request was already decided", 409);
    }
    console.error("Unable to decide loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to decide loan request", 500);
  }
}
