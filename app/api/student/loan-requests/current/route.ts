import { apiError, apiOk } from "@/lib/api-response";
import { getStudentSessionContext, resolveStoredStudent } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

/**
 * Get the current student's open loan request.
 * @tag Student loans
 * @auth cookieAuth
 * @response 200:LoanRequestCurrentResponse
 * @add 401:ApiErrorResponse
 */
export async function GET() {
  const context = await getStudentSessionContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const user = await resolveStoredStudent(context.identity);
  if (!user) return apiOk(null);

  const loan = await prisma.loanRequest.findFirst({
    where: {
      studentId: user.id,
      status: { notIn: ["closed", "rejected", "cancelled"] },
    },
    include: {
      advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
      approvals: { orderBy: [{ step: "asc" }, { attempt: "asc" }] },
    },
    orderBy: { createdAt: "desc" },
  });
  return apiOk(serializeJson(loan));
}
