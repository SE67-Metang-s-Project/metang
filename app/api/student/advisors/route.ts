import { listAdvisors } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { getStudentSessionContext } from "@/lib/loan-auth";

/**
 * List available advisors for student loan application.
 * @tag Student loans
 * @auth cookieAuth
 * @response 200:AdvisorListResponse
 * @add 401:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const context = await getStudentSessionContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  try {
    const advisors = await listAdvisors();
    return apiOk(advisors);
  } catch (error) {
    console.error("Unable to list advisors", error);
    return apiError("INTERNAL_ERROR", "Unable to list advisors", 500);
  }
}
