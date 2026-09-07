import { advisorLoanSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdvisorContext } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Get an advisor-assigned loan request detail.
 * @tag Advisor loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:AdvisorLoanRequestDetailResponse
 * @add 404:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const context = await getAdvisorContext();
  if (!context) return apiError("NOT_FOUND", "Loan request not found", 404);

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  const loan = await prisma.loanRequest.findFirst({
    where: { id, advisorId: context.user.id },
    select: advisorLoanSelect,
  });
  if (!loan) return apiError("NOT_FOUND", "Loan request not found", 404);
  return apiOk(serializeJson(loan));
}
