import { mutateUserRole, RoleMutationError } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { parseRoleMutationInput } from "@/lib/role-management";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

type Params = { params: Promise<{ id: string }> };

/**
 * Grant or remove a predefined role for an application user.
 * @description Removing `admin` or `super_admin` from someone left with neither hands their open pending_admin/pending_executive loans to the calling SuperAdmin. Removing `advisor` cancels that advisor's pending_advisor loans (the student applies again with another advisor); loans past the advisor step carry on. Refused with 409: granting `admin` or `super_admin` to an advisor, or `advisor` to an admin or SuperAdmin (ADVISOR_ADMIN_CONFLICT), removing the final `super_admin`, removing your own `super_admin` (a successor removes you), removing `executive` (edit the executive instead), and granting a second `executive`.
 * @tag SuperAdmin roles
 * @pathParams UserIdParams
 * @body RoleMutationBody
 * @auth cookieAuth
 * @response 200:SuperAdminUserResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request, { params }: Params) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  let input;
  try {
    input = parseRoleMutationInput(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  const { id } = await params;
  if (!isUuid(id)) return apiError("NOT_FOUND", "User not found", 404);

  try {
    const updatedUser = await mutateUserRole({
      actorId: access.context.user.id,
      targetUserId: id,
      action: input.action,
      role: input.role,
    });
    return apiOk(serializeJson(updatedUser));
  } catch (error) {
    if (error instanceof RoleMutationError) {
      if (error.code === "USER_NOT_FOUND") return apiError("NOT_FOUND", "User not found", 404);
      if (error.code === "ACCESS_REVOKED") {
        return apiError("CONFLICT", "The request changed; please retry", 409);
      }
      if (error.code === "ROLE_ALREADY_GRANTED") {
        return apiError("CONFLICT", "Role is already granted", 409);
      }
      if (error.code === "ADVISOR_ADMIN_CONFLICT") {
        return apiError(
          "ADVISOR_ADMIN_CONFLICT",
          "An advisor cannot also be an admin or SuperAdmin",
          409,
        );
      }
      if (error.code === "ROLE_NOT_GRANTED") {
        return apiError("CONFLICT", "Role is not currently granted", 409);
      }
      if (error.code === "FINAL_SUPER_ADMIN") {
        return apiError("FINAL_SUPER_ADMIN", "The final SuperAdmin role cannot be removed", 409);
      }
      if (error.code === "SELF_DEMOTION") {
        return apiError("SELF_DEMOTION", "You cannot remove your own SuperAdmin role", 409);
      }
      if (error.code === "EXECUTIVE_ROLE_LOCKED") {
        return apiError(
          "EXECUTIVE_ROLE_LOCKED",
          "The executive role cannot be removed; edit the executive's name and email instead",
          409,
        );
      }
      if (error.code === "EXECUTIVE_ADVISOR_LOCKED") {
        return apiError(
          "EXECUTIVE_ADVISOR_LOCKED",
          "The executive is also an advisor; the advisor role cannot be removed from the executive",
          409,
        );
      }
      if (error.code === "REASSIGNMENT_CONFLICT") {
        return apiError("CONFLICT", "The loan assignment changed; please retry", 409);
      }
      if (error.code === "EXECUTIVE_ALREADY_EXISTS") {
        return apiError(
          "EXECUTIVE_ALREADY_EXISTS",
          "มีผู้บริหารในระบบอยู่แล้ว ไม่สามารถแต่งตั้งเพิ่มได้ (จำกัด 1 คน)",
          409,
        );
      }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("CONFLICT", "The role assignment changed; please retry", 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return apiError("CONFLICT", "The role assignment changed; please retry", 409);
    }
    console.error("Unable to mutate user role", error);
    return apiError("INTERNAL_ERROR", "Unable to mutate user role", 500);
  }
}
