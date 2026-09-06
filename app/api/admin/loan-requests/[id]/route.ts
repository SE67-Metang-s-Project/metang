import { adminLoanDetailSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdminAccess } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Get a loan request awaiting an Admin decision.
 * @tag Admin loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:AdminLoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
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
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  try {
    const loan = await prisma.loanRequest.findFirst({
      where: {
        id,
        status: "pending_admin",
        OR: [{ assignedAdminId: null }, { assignedAdminId: access.context.user.id }],
      },
      select: adminLoanDetailSelect,
    });
    if (!loan) return apiError("NOT_FOUND", "Loan request not found", 404);
    return apiOk(serializeJson(loan));
  } catch (error) {
    console.error("Unable to get Admin loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to get loan request", 500);
  }
}
