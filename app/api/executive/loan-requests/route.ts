import { executiveLoanSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getExecutiveAccess } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

/**
 * List loan requests awaiting the active Executive's final decision.
 * @tag Executive loans
 * @auth cookieAuth
 * @response 200:ExecutiveQueueResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const access = await getExecutiveAccess();
  if (access.status === "unauthenticated") return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (access.status === "forbidden") return apiError("FORBIDDEN", "Executive access required", 403);

  try {
    const loans = await prisma.loanRequest.findMany({
      where: { status: "pending_executive" },
      select: executiveLoanSelect,
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    });
    return apiOk(serializeJson(loans));
  } catch (error) {
    console.error("Unable to list Executive loan requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list loan requests", 500);
  }
}
