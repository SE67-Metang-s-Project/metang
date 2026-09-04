import { Prisma } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { bangkokDatePlusDays } from "@/lib/date";
import { getStudentContext } from "@/lib/loan-auth";
import { isUuid, parseLoanInput } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";
import { studentLoanSelect } from "@/db/queries/loan-requests";


type Params = { params: Promise<{ id: string }> };

/**
 * Resubmit a returned student loan request.
 * @tag Student loans
 * @pathParams LoanRequestIdParams
 * @auth cookieAuth
 * @body LoanInput
 * @response 200:LoanRequestDetailResponse
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

  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  let input;
  try {
    input = parseLoanInput(await request.json());
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
    const loan = await prisma.$transaction(async (tx) => {
      const current = await tx.loanRequest.findFirst({
        where: { id, studentId: context.user.id, status: "returned" },
        select: studentLoanSelect,
      });
      if (!current) throw new Error("STALE_RESUBMIT");

      const latestReturned = await tx.loanApproval.findFirst({
        where: { loanId: id, decision: "returned" },
        orderBy: [{ decidedAt: "desc" }, { id: "desc" }],
        select: { step: true },
      });

      const advisors = await tx.appUser.findMany({
        where: {
          fullNameTh: input.advisorName,
          roles: { some: { role: "advisor" } },
        },
        select: { id: true },
      });
      if (advisors.length !== 1) throw new Error("advisorName is ambiguous or not found");

      const advisorId = advisors[0].id;
      const step = latestReturned?.step === "admin" && current.advisorId === advisorId ? "admin" : "advisor";
      const status = step === "admin" ? "pending_admin" : "pending_advisor";

      const firstDueDate = bangkokDatePlusDays(30);
      const submittedAt = new Date();
      const updated = await tx.loanRequest.updateMany({
        where: { id, studentId: context.user.id, status: "returned" },
        data: {
          advisorId,
          amount: input.amount,
          studentYear: input.studentYear,
          purpose: input.purpose,
          additionalNote: input.additionalNote,
          bankName: input.bankName,
          bankAccountNo: input.bankAccountNo,
          bankAccountName: input.bankAccountName,
          installmentCount: input.installmentCount,
          firstDueDate,
          approvedAmount: null,
          status,
          submittedAt,
        },
      });
      if (updated.count !== 1) throw new Error("STALE_RESUBMIT");

      const latestApproval = await tx.loanApproval.findFirst({
        where: { loanId: id, step },
        orderBy: { attempt: "desc" },
        select: { attempt: true },
      });
      const attempt = (latestApproval?.attempt ?? 0) + 1;
      await tx.loanApproval.create({ data: { loanId: id, step, attempt } });


      const final = await tx.loanRequest.findUniqueOrThrow({
        where: { id },
        select: studentLoanSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId: context.user.id,
          action: "loan_request.resubmitted",
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
    if (error instanceof Error && error.message === "STALE_RESUBMIT") {
      return apiError("CONFLICT", "The request is no longer available for resubmission", 409);
    }
    if (error instanceof Error && error.message.includes("advisorName")) {
      return apiError("VALIDATION_ERROR", error.message, 422);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return apiError("CONFLICT", "The request changed; please try again", 409);
    }
    console.error("Unable to resubmit loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to resubmit loan request", 500);
  }
}
