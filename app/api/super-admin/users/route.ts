import { createManagedUser, listUsersWithRoles, RoleMutationError } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { validateJsonRequest } from "@/lib/request-security";
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

/**
 * Add a new managed user (admin or super_admin).
 * @tag SuperAdmin roles
 * @auth cookieAuth
 */
export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON request", 422);
  }

  if (!body || typeof body !== "object") {
    return apiError("VALIDATION_ERROR", "Request body must be an object", 422);
  }

  const { fullNameTh, email, fullNameEn, role } = body as Record<string, unknown>;

  if (typeof fullNameTh !== "string" || !fullNameTh.trim()) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุชื่อ-นามสกุล", 422);
  }

  if (typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุอีเมลที่ถูกต้อง", 422);
  }

  if (role !== "admin" && role !== "super_admin") {
    return apiError("VALIDATION_ERROR", "บทบาทต้องเป็น 'admin' หรือ 'super_admin'", 422);
  }

  try {
    const newUser = await createManagedUser({
      actorId: access.context.user.id,
      email: email.trim(),
      fullNameTh: fullNameTh.trim(),
      fullNameEn: typeof fullNameEn === "string" ? fullNameEn.trim() : null,
      role,
    });
    return apiOk(serializeJson(newUser));
  } catch (error) {
    if (error instanceof RoleMutationError) {
      if (error.code === "ROLE_ALREADY_GRANTED") {
        return apiError("CONFLICT", "ผู้ใช้งานนี้มีบทบาทนี้อยู่แล้ว", 409);
      }
    }
    console.error("Unable to create/add managed user", error);
    return apiError("INTERNAL_ERROR", "Unable to create/add user", 500);
  }
}

