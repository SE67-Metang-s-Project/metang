import { getLoanRequests } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { getCmuSession } from "@/lib/cmu-auth";
import { isDevelopmentApiAccess } from "@/lib/development-access";
import {
  getDevelopmentStaffContext,
  normalizeLoanIdentity,
  resolveStudentIdentity,
} from "@/lib/loan-auth";
import { getLoanListAccess } from "@/lib/loan-request-list";
import { serializeJson } from "@/lib/serialization";

/**
 * List loan requests visible to the current staff member.
 * @description Returns every request for global staff roles and assigned requests for advisors.
 * @tag Loan requests
 * @auth cookieAuth
 * @response 200:LoanRequestListResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 */
export async function GET() {
  if (isDevelopmentApiAccess()) {
    const context = await getDevelopmentStaffContext();
    if (!context) {
      return apiOk(serializeJson(await getLoanRequests({ scope: "global" })));
    }
    const access = getLoanListAccess(context.user.roles.map(({ role }) => role));
    if (access === "denied") {
      return apiError("FORBIDDEN", "Loan request access required", 403);
    }
    return apiOk(
      serializeJson(
        await getLoanRequests(
          access === "all" ? { scope: "global" } : { scope: "assigned", advisorId: context.user.id },
        ),
      ),
    );
  }

  const session = await getCmuSession();
  if (!session) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const user = await resolveStudentIdentity(normalizeLoanIdentity(session.profile));
  const access = getLoanListAccess(user?.roles.map(({ role }) => role) ?? []);
  if (!user || access === "denied") {
    return apiError("FORBIDDEN", "Loan request access required", 403);
  }

  const loans = await getLoanRequests(
    access === "all" ? { scope: "global" } : { scope: "assigned", advisorId: user.id },
  );
  return apiOk(serializeJson(loans));
}
