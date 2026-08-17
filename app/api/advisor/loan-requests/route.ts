import { getAdvisorContext } from "@/lib/loan-auth";
import { advisorLoanSelect } from "@/db/queries/loan-requests";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api-response";
import { serializeJson } from "@/lib/serialization";

/**
 * List loan requests awaiting the current advisor's decision.
 * @tag Advisor loans
 * @auth cookieAuth
 * @response 200:AdvisorQueueResponse
 * @add 401:ApiErrorResponse
 */
export async function GET() {
  const context = await getAdvisorContext();
  if (!context) return apiError("UNAUTHORIZED", "Advisor access required", 401);

  const loans = await prisma.loanRequest.findMany({
    where: { advisorId: context.user.id, status: "pending_advisor" },
    select: advisorLoanSelect,
    orderBy: { submittedAt: "asc" },
  });
  return apiOk(serializeJson(loans));
}
