import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { bangkokDatePlusDays } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { isUniqueConstraintOnField } from "@/lib/prisma-errors";
import { parseLoanInput } from "@/lib/loan-validation";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";
import { getStudentContext, getStudentSessionContext } from "@/lib/loan-auth";
import { getStudentLoanList, studentLoanDetailSelect } from "@/db/queries/loan-requests";
import { enqueueReviewerNotifications } from "@/db/queries/notification-recipients";
import { FundMutationError, getFundCapacity } from "@/db/queries/fund-transactions";
import { normalizeBankName } from "@/lib/bank-name";
import { getEducationLevelCode } from "@/lib/student-code";

/**
 * List the current student's loan requests.
 * @tag Student loans
 * @auth cookieAuth
 * @response 200:LoanRequestDetailListResponse
 * @add 401:ApiErrorResponse
 */

export async function GET() {
  const context = await getStudentSessionContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  try {
    const loans = await getStudentLoanList(context.identity.studentCode);
    return apiOk(loans);
  } catch (error) {
    console.error("Unable to list student loan requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list loan requests", 500);
  }
}

/**
 * Submit a student loan request.
 * @description An amount larger than the fund's available capacity (cash balance minus what loan requests not yet paid out may still take) is rejected with 409 INSUFFICIENT_FUND_CAPACITY.
 * @tag Student loans
 * @auth cookieAuth
 * @body LoanInput
 * @response 201:LoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */

export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);
  const student = context.user;

  let input;
  try {
    input = parseLoanInput(await request.json());
    input = { ...input, bankName: normalizeBankName(input.bankName) };
  } catch (error) {
    return apiError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid request", 422);
  }

  try {
    const loan = await prisma.$transaction(async (tx) => {
      if (!student.email) throw new Error("CMU account is missing");

      const advisors = await tx.appUser.findMany({
        where: {
          fullNameTh: input.advisorName,
          roles: { some: { role: UserRoleName.advisor } },
        },
        select: { id: true },
      });

      // if no advisor founded
      if (advisors.length !== 1) throw new Error("advisorName is ambiguous or not found");

      // A request may not reserve more than the fund can still lend (see computeFundCapacity).
      const { available } = await getFundCapacity(tx);
      if (input.amount > available) throw new FundMutationError("CAPACITY_EXCEEDED", available);

      const created = await tx.loanRequest.create({
        data: {
          amount: input.amount,
          studentYear: input.studentYear,
          purpose: input.purpose,
          bankName: input.bankName,
          bankAccountNo: input.bankAccountNo,
          bankAccountName: input.bankAccountName,
          installmentCount: input.installmentCount,
          studentCode: student.studentCode,
          studentNameTh: student.fullNameTh,
          studentNameEn: student.fullNameEn,
          studentEmail: student.email,
          studentPhone: input.phoneNumber ?? student.phone,
          studentEducationLevel: getEducationLevelCode(student.studentCode),
          advisorId: advisors[0].id,
          firstDueDate: bangkokDatePlusDays(30),
          status: "pending_advisor",
          submittedAt: new Date(),
        },
      });
      await tx.loanApproval.create({ data: { loanId: created.id, step: "advisor", attempt: 1 } });

      const audit = await tx.auditLog.create({
        data: {
          actorStudentCode: student.studentCode,
          action: "loan_request.created",
          entityType: "loan_request",
          entityId: created.id,
          after: serializeJson(created),
        },
      });
      await enqueueReviewerNotifications(tx, { loanId: created.id, auditLogId: audit.id });
      return tx.loanRequest.findUniqueOrThrow({ where: { id: created.id }, select: studentLoanDetailSelect });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });

    return apiOk(serializeJson(loan), 201);
  } catch (error) {
    if (error instanceof FundMutationError && error.code === "CAPACITY_EXCEEDED") {
      return apiError(
        "INSUFFICIENT_FUND_CAPACITY",
        "The requested amount is more than the fund can currently lend",
        409,
      );
    }
    if (isUniqueConstraintOnField(error, "student_code")) {
      return apiError("CONFLICT", "You already have an open loan request", 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return apiError("CONFLICT", "The request changed; please try again", 409);
    }
    if (
      error instanceof Error &&
      (error.message.includes("advisorName") || error.message.includes("CMU account"))
    ) {
      return apiError("VALIDATION_ERROR", error.message, 422);
    }
    console.error("Unable to create loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to create loan request", 500);
  }
}
