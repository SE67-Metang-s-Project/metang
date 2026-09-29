// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { apiError } from "@/lib/api-response";
import type { RoleAccess } from "@/lib/loan-auth";

/** The 401 or 403 for an access result that is not authorized. */
export function accessError(
  access: Exclude<RoleAccess, { status: "authorized" }>,
  forbiddenMessage: string,
) {
  return access.status === "unauthenticated"
    ? apiError("UNAUTHORIZED", "Authentication required", 401)
    : apiError("FORBIDDEN", forbiddenMessage, 403);
}
