import { apiError, apiOk } from "@/lib/api-response";
import { getStudentSessionContext } from "@/lib/loan-auth";
import { getStudentCurrentLoan } from "@/db/queries/loan-requests";

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

  const loan = await getStudentCurrentLoan(context.identity.studentCode);
  return apiOk(loan);
}
