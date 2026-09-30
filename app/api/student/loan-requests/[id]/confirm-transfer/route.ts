import { apiError, apiOk } from "@/lib/api-response";
import { getStudentContext } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { isSameOrigin } from "@/lib/request-security";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";
import { studentLoanSelect } from "@/db/queries/loan-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * Confirm that the current student received the money of their disbursed loan.
 * @description Repayment slips are accepted only after this confirmation. Calling it again on a confirmed loan returns the loan unchanged, so a double click or a second device is safe.
 * @tag Student loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @response 200:LoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 */
export async function POST(request: Request, { params }: Params) {
  // Confirm sends no body, so validateJsonRequest (which requires application/json) does not
  // apply - check same-origin directly instead.
  if (!isSameOrigin(request)) {
    return apiError("FORBIDDEN", "A same-origin request is required", 403);
  }

  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  try {
    const loan = await prisma.$transaction(async (tx) => {
      const current = await tx.loanRequest.findFirst({
        where: { id, studentCode: context.user.studentCode },
        select: studentLoanSelect,
      });
      if (!current) throw new Error("NOT_FOUND");
      // Idempotent: already confirmed means nothing to write and nothing to audit.
      if (current.transferConfirmedAt) return current;
      if (current.status !== "disbursed") throw new Error("STALE_CONFIRM");

      const updated = await tx.loanRequest.updateMany({
        where: {
          id,
          studentCode: context.user.studentCode,
          status: "disbursed",
          transferConfirmedAt: null,
        },
        data: { transferConfirmedAt: new Date() },
      });

      const final = await tx.loanRequest.findUniqueOrThrow({
        where: { id },
        select: studentLoanSelect,
      });
      if (updated.count !== 1) {
        // A concurrent confirm won the race: same outcome, and that request wrote the audit row.
        if (final.transferConfirmedAt) return final;
        throw new Error("STALE_CONFIRM");
      }

      await tx.auditLog.create({
        data: {
          actorStudentCode: context.user.studentCode,
          action: "loan_request.transfer_confirmed",
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
    if (error instanceof Error && error.message === "STALE_CONFIRM") {
      return apiError(
        "CONFLICT",
        "The loan transfer cannot be confirmed in its current status",
        409,
      );
    }
    console.error("Unable to confirm loan transfer", error);
    return apiError("INTERNAL_ERROR", "Unable to confirm loan transfer", 500);
  }
}
