import { deleteManagedUser, editExecutive, RoleMutationError } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { isSameOrigin, validateJsonRequest } from "@/lib/request-security";
import { isCmuEmail } from "@/lib/role-management";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

const isRetryableConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034");

/**
 * Remove a staff member (admin or super_admin).
 * @description Takes away the user's admin and super_admin roles and hands their open pending_admin/pending_executive loans to the calling SuperAdmin. The user record stays, so their past decisions keep their name. Refused for the caller themself (a leaving SuperAdmin is removed by a successor), for the final SuperAdmin, and for the executive, who is replaced through PATCH instead.
 * @tag SuperAdmin roles
 * @pathParams UserIdParams
 * @auth cookieAuth
 * @response 200:SuperAdminUserDeleteResponse
 * @add 400:ApiErrorResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 */
export async function DELETE(request: Request, { params }: Params) {
  // DELETE sends no body, so validateJsonRequest (which requires application/json) does not apply.
  if (!isSameOrigin(request)) {
    return apiError("FORBIDDEN", "A same-origin request is required", 403);
  }

  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  const { id } = await params;
  if (!isUuid(id)) return apiError("NOT_FOUND", "User not found", 404);

  try {
    await deleteManagedUser({
      actorId: access.context.user.id,
      targetUserId: id,
    });
    return apiOk({ success: true, message: "ลบผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (error) {
    if (error instanceof RoleMutationError) {
      if (error.code === "USER_NOT_FOUND") return apiError("NOT_FOUND", "User not found", 404);
      if (error.code === "SELF_DEMOTION") {
        return apiError(
          "SELF_DEMOTION",
          "ไม่สามารถลบบัญชีของตนเองได้ กรุณาแต่งตั้งผู้ดูแลระบบคนใหม่ แล้วให้ผู้ดูแลระบบคนนั้นลบบัญชีของคุณ",
          409,
        );
      }
      if (error.code === "FINAL_SUPER_ADMIN") {
        return apiError(
          "FINAL_SUPER_ADMIN",
          "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ (ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนในระบบ)",
          409,
        );
      }
      if (error.code === "EXECUTIVE_CANNOT_BE_DELETED") {
        return apiError("BAD_REQUEST", "ไม่สามารถลบผู้บริหารได้ กรุณาแก้ไขข้อมูลผู้บริหารแทน", 400);
      }
      if (error.code === "NOT_MANAGED_USER") {
        return apiError("CONFLICT", "ผู้ใช้งานนี้ไม่ได้เป็นเจ้าหน้าที่หรือผู้ดูแลระบบ", 409);
      }
      if (error.code === "REASSIGNMENT_CONFLICT") {
        return apiError("CONFLICT", "The loan assignment changed; please retry", 409);
      }
    }
    if (isRetryableConflict(error)) {
      return apiError("CONFLICT", "The user changed; please retry", 409);
    }
    console.error("Unable to delete user", error);
    return apiError("INTERNAL_ERROR", "Unable to delete user", 500);
  }
}

/**
 * Edit the executive's name and email.
 * @description Only the executive can be edited. The same email fixes the names in place. A different email hands the executive role to a new person created from it, and the response is the new executive; the previous executive keeps their other roles and history. An email or CMU account that already belongs to another user is refused with 409.
 * @tag SuperAdmin roles
 * @pathParams UserIdParams
 * @body EditExecutiveBody
 * @auth cookieAuth
 * @response 200:SuperAdminUserResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 */
export async function PATCH(request: Request, { params }: Params) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  const { id } = await params;
  if (!isUuid(id)) return apiError("NOT_FOUND", "User not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON request", 422);
  }

  if (!body || typeof body !== "object") {
    return apiError("VALIDATION_ERROR", "Request body must be an object", 422);
  }

  const { fullNameTh, email, fullNameEn } = body as Record<string, unknown>;

  if (typeof fullNameTh !== "string" || !fullNameTh.trim()) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุชื่อ-นามสกุล", 422);
  }

  if (typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุอีเมลที่ถูกต้อง", 422);
  }

  if (!isCmuEmail(email)) {
    return apiError("VALIDATION_ERROR", "กรุณาระบุอีเมล CMU (ลงท้ายด้วย @cmu.ac.th)", 422);
  }

  try {
    const executive = await editExecutive({
      actorId: access.context.user.id,
      targetUserId: id,
      fullNameTh: fullNameTh.trim(),
      fullNameEn: typeof fullNameEn === "string" ? fullNameEn.trim() : null,
      email: email.trim(),
    });
    return apiOk(serializeJson(executive));
  } catch (error) {
    if (error instanceof RoleMutationError) {
      if (error.code === "USER_NOT_FOUND") return apiError("NOT_FOUND", "User not found", 404);
      if (error.code === "EMAIL_ALREADY_IN_USE") {
        return apiError("CONFLICT", "อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409);
      }
      if (error.code === "NOT_EXECUTIVE") {
        return apiError("CONFLICT", "แก้ไขได้เฉพาะข้อมูลผู้บริหารเท่านั้น", 409);
      }
    }
    if (isRetryableConflict(error)) {
      return apiError("CONFLICT", "The user changed; please retry", 409);
    }
    console.error("Unable to update user", error);
    return apiError("INTERNAL_ERROR", "Unable to update user", 500);
  }
}
