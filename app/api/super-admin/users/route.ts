import { createManagedUser, listUsersWithRoles, RoleMutationError } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { isUniqueConstraintOnField } from "@/lib/prisma-errors";
import { validateJsonRequest } from "@/lib/request-security";
import { isCmuEmail, isNameTooLong, MAX_NAME_LENGTH, predefinedRoleNames } from "@/lib/role-management";
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
 * Add a staff member (admin or super_admin).
 * @description Creates the user with the role. They sign in later with CMU SSO. A removed staff member (their record kept for history, no roles left) gets the role back on the same record, names unchanged. An email or CMU account that belongs to someone holding any role (staff, advisor, the executive) is refused with 409; nobody is renamed here.
 * @tag SuperAdmin roles
 * @body CreateManagedUserBody
 * @auth cookieAuth
 * @response 200:SuperAdminUserResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
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

  if (isNameTooLong(fullNameTh, fullNameEn)) {
    return apiError("VALIDATION_ERROR", `ชื่อ-นามสกุลต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`, 422);
  }

  if (typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุอีเมลที่ถูกต้อง", 422);
  }

  if (!isCmuEmail(email)) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุอีเมล CMU (ลงท้ายด้วย @cmu.ac.th)", 422);
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
    if (error instanceof RoleMutationError && error.code === "EMAIL_ALREADY_IN_USE") {
      return apiError("CONFLICT", "อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409);
    }
    if (error instanceof RoleMutationError && error.code === "ACCESS_REVOKED") {
      return apiError("CONFLICT", "The request changed; please retry", 409);
    }
    // Two Adds for the same new email at once: the loser hits the unique index, not the lookup.
    if (isUniqueConstraintOnField(error, "email") || isUniqueConstraintOnField(error, "cmu_account")) {
      return apiError("CONFLICT", "อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
      return apiError("CONFLICT", "The user changed; please retry", 409);
    }
    console.error("Unable to create/add managed user", error);
    return apiError("INTERNAL_ERROR", "Unable to create/add user", 500);
  }
}

