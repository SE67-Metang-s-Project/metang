import { executiveLoanSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getExecutiveAccess } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Get a loan request awaiting the active Executive's decision.
 * @tag Executive loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:ExecutiveLoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const access = await getExecutiveAccess();
  if (access.status === "unauthenticated") return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (access.status === "forbidden") return apiError("FORBIDDEN", "Executive access required", 403);

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);
  try {
    const loan = await prisma.loanRequest.findFirst({
      where: { id, status: "pending_executive" },
      select: executiveLoanSelect,
    });
    if (!loan) return apiError("NOT_FOUND", "Loan request not found", 404);
    return apiOk(serializeJson(loan));
  } catch (error) {
    console.error("Unable to get Executive loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to get loan request", 500);
  }
}
