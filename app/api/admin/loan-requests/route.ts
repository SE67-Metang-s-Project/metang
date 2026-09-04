import { adminQueueSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdminAccess } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

/**
 * List loan requests awaiting an Admin decision.
 * @tag Admin loans
 * @auth cookieAuth
 * @response 200:AdminQueueResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  try {
    const loans = await prisma.loanRequest.findMany({
      where: {
        status: "pending_admin",
        OR: [{ assignedAdminId: null }, { assignedAdminId: access.context.user.id }],
      },
      select: adminQueueSelect,
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    });
    return apiOk(serializeJson(loans));
  } catch (error) {
    console.error("Unable to list Admin loan requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list loan requests", 500);
  }
}
