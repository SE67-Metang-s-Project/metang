import { apiError, apiOk } from "@/lib/api-response";
import { getStudentContext } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Get a student loan request detail.
 * @tag Student loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:LoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 404:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  if (!isUuid(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  const loan = await prisma.loanRequest.findFirst({
    where: { id, studentId: context.user.id },
    include: {
      advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
      approvals: { orderBy: [{ step: "asc" }, { attempt: "asc" }] },
    },
  });
  if (!loan) return apiError("NOT_FOUND", "Loan request not found", 404);
  return apiOk(serializeJson(loan));
}
