import { listUsersWithRoles } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { predefinedRoleNames } from "@/lib/role-management";
import { serializeJson } from "@/lib/serialization";

/**
 * List application users, their predefined roles, and available roles.
 * @tag SuperAdmin roles
 * @auth cookieAuth
 * @response 200:SuperAdminUserListResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  try {
    const users = await listUsersWithRoles();
    return apiOk(serializeJson({ users, availableRoles: predefinedRoleNames }));
  } catch (error) {
    console.error("Unable to list users and roles", error);
    return apiError("INTERNAL_ERROR", "Unable to list users and roles", 500);
  }
}
