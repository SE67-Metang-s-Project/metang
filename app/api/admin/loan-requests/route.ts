import { adminQueueSelect } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getAdminAccess } from "@/lib/loan-auth";
import { parseAdminLoanQueueStatus } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { serializeJson } from "@/lib/serialization";

/**
 * List loan requests awaiting Admin/SuperAdmin action. Defaults to loans
 * awaiting an Admin decision; pass `?status=pending_disbursement` for loans
 * awaiting disbursement, which are open to any Admin or SuperAdmin.
 * @tag Admin loans
 * @auth cookieAuth
 * @query AdminLoanQueueQuery
 * @response 200:AdminQueueResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  let status;
  try {
    status = parseAdminLoanQueueStatus(new URL(request.url).searchParams.get("status"));
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  try {
    const where =
      status === "pending_disbursement"
        ? { status: "pending_disbursement" as const }
        : {
            status: "pending_admin" as const,
            OR: [{ assignedAdminId: null }, { assignedAdminId: access.context.user.id }],
          };

    const loans = await prisma.loanRequest.findMany({
      where,
      select: adminQueueSelect,
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    });
    return apiOk(serializeJson(loans));
  } catch (error) {
    console.error("Unable to list Admin loan requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list loan requests", 500);
  }
}
