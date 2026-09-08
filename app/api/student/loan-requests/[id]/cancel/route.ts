import { apiError, apiOk } from "@/lib/api-response";
import { LoanStatus } from "@/lib/generated/prisma/client";
import { getStudentContext } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";
import { studentLoanSelect } from "@/db/queries/loan-requests";

type Params = { params: Promise<{ id: string }> };

const terminalStatuses: LoanStatus[] = ["closed", "rejected", "cancelled"];

/**
 * Cancel the current student's active loan request.
 * @tag Student loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:LoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 */
export async function POST(_request: Request, { params }: Params) {
  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  try {
    const loan = await prisma.$transaction(async (tx) => {
      const current = await tx.loanRequest.findFirst({
        where: { id, studentId: context.user.id },
        select: studentLoanSelect,
      });
      if (!current) throw new Error("NOT_FOUND");
      if (terminalStatuses.includes(current.status)) throw new Error("STALE_CANCEL");

      const cancelledAt = new Date();
      const updated = await tx.loanRequest.updateMany({
        where: {
          id,
          studentId: context.user.id,
          status: { notIn: terminalStatuses },
        },
        data: {
          status: "cancelled",
          cancelledAt,
          cancelledBy: context.user.id,
        },
      });
      if (updated.count !== 1) throw new Error("STALE_CANCEL");

      const final = await tx.loanRequest.findUniqueOrThrow({ where: { id }, select: studentLoanSelect });
      await tx.auditLog.create({
        data: {
          actorId: context.user.id,
          action: "loan_request.cancelled",
          entityType: "loan_request",
          entityId: id,
          before: serializeJson(current),
          after: serializeJson(final),
        },
      });
      return final;
    });

    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof Error && error.message === "STALE_CANCEL") {
      return apiError("CONFLICT", "The request can no longer be cancelled", 409);
    }
    console.error("Unable to cancel loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to cancel loan request", 500);
  }
}
