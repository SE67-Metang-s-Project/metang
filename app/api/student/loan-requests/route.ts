import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { bangkokDatePlusDays } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { parseLoanInput } from "@/lib/loan-validation";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";
import {
  getStudentSessionContext,
  resolveStoredStudent,
} from "@/lib/loan-auth";
import {
  enqueueNotification,
  LOAN_REVIEW_REQUESTED_EVENT,
} from "@/db/queries/notifications";

const loanInclude = {
  approvals: { orderBy: [{ step: "asc" as const }, { attempt: "asc" as const }] },
  advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
};

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

  const user = await resolveStoredStudent(context.identity);
  if (!user) return apiOk([]);

  const loans = await prisma.loanRequest.findMany({
    where: { studentId: user.id },
    include: loanInclude,
    orderBy: { createdAt: "desc" },
  });
  return apiOk(serializeJson(loans));
}

/**
 * Submit a student loan request.
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

  const context = await getStudentSessionContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  let input;
  try {
    input = parseLoanInput(await request.json());
  } catch (error) {
    return apiError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid request", 422);
  }

  try {
    const loan = await prisma.$transaction(async (tx) => {
      if (!context.identity.cmuAccount) throw new Error("CMU account is missing");

      const advisors = await tx.appUser.findMany({
        where: {
          fullNameTh: input.advisorName,
          roles: { some: { role: UserRoleName.advisor } },
        },
        select: { id: true },
      });

      // if no advisor founded
      if (advisors.length !== 1) throw new Error("advisorName is ambiguous or not found");
      
      const existing = await tx.appUser.findFirst({
        where: {
          OR: [
            { cmuAccount: context.identity.cmuAccount },
            ...(context.identity.email ? [{ email: context.identity.email }] : []),
            ...(context.identity.studentCode ? [{ studentCode: context.identity.studentCode }] : []),
          ],
        },
        select: { id: true, cmuAccount: true, email: true, studentCode: true },
      });

      if (
        existing &&
        ((existing.cmuAccount !== context.identity.cmuAccount) ||
          (context.identity.email && existing.email !== context.identity.email) ||
          (context.identity.studentCode && existing.studentCode !== context.identity.studentCode))
      ) {
        throw new Error("CMU identity does not match the existing student");
      }

      const student = existing
        ? await tx.appUser.update({
            where: { id: existing.id },
            data: {
              cmuAccount: context.identity.cmuAccount,
              email: context.identity.email ?? existing.email,
              studentCode: context.identity.studentCode,
              fullNameTh: context.identity.displayName,
            },
          })
        : await tx.appUser.create({
            data: {
              cmuAccount: context.identity.cmuAccount,
              email: context.identity.email ?? context.identity.cmuAccount,
              studentCode: context.identity.studentCode,
              fullNameTh: context.identity.displayName,
            },
          });

      await tx.userRole.upsert({
        where: { userId_role: { userId: student.id, role: UserRoleName.student } },
        create: { userId: student.id, role: UserRoleName.student },
        update: {},
      });

      const created = await tx.loanRequest.create({
        data: {
          amount: input.amount,
          studentYear: input.studentYear,
          purpose: input.purpose,
          additionalNote: input.additionalNote,
          bankName: input.bankName,
          bankAccountNo: input.bankAccountNo,
          bankAccountName: input.bankAccountName,
          installmentCount: input.installmentCount,
          studentId: student.id,
          advisorId: advisors[0].id,
          firstDueDate: bangkokDatePlusDays(30),
          status: "pending_advisor",
          submittedAt: new Date(),
        },
      });
      await tx.loanApproval.create({ data: { loanId: created.id, step: "advisor", attempt: 1 } });
      await enqueueNotification(tx, {
        dedupeKey: `loan:${created.id}:review:advisor:1`,
        eventType: LOAN_REVIEW_REQUESTED_EVENT,
        payload: {
          loanId: created.id,
          step: "advisor",
          recipient: { userId: created.advisorId },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: student.id,
          action: "loan_request.created",
          entityType: "loan_request",
          entityId: created.id,
          after: serializeJson(created),
        },
      });
      return tx.loanRequest.findUniqueOrThrow({ where: { id: created.id }, include: loanInclude });
    });

    return apiOk(serializeJson(loan), 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return apiError("CONFLICT", "You already have an open loan request", 409);
    }
    if (
      error instanceof Error &&
      (error.message.includes("advisorName") ||
        error.message.includes("CMU account") ||
        error.message.includes("CMU identity"))
    ) {
      return apiError("VALIDATION_ERROR", error.message, 422);
    }
    console.error("Unable to create loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to create loan request", 500);
  }
}
