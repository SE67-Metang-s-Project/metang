import { deleteManagedUser, RoleMutationError, updateManagedUser } from "@/db/queries/users";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { validateJsonRequest } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

/**
 * Delete a managed user (admin or super_admin).
 * @tag SuperAdmin roles
 * @auth cookieAuth
 */
export async function DELETE(_request: Request, { params }: Params) {
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
    }
    console.error("Unable to delete user", error);
    return apiError("INTERNAL_ERROR", "Unable to delete user", 500);
  }
}

/**
 * Update user details (name, email).
 * @tag SuperAdmin roles
 * @auth cookieAuth
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

  try {
    const updatedUser = await updateManagedUser({
      actorId: access.context.user.id,
      targetUserId: id,
      fullNameTh: fullNameTh.trim(),
      fullNameEn: typeof fullNameEn === "string" ? fullNameEn.trim() : null,
      email: email.trim(),
    });
    return apiOk(serializeJson(updatedUser));
  } catch (error) {
    if (error instanceof RoleMutationError) {
      if (error.code === "USER_NOT_FOUND") return apiError("NOT_FOUND", "User not found", 404);
      if (error.code === "EMAIL_ALREADY_IN_USE") {
        return apiError("CONFLICT", "อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409);
      }
    }
    console.error("Unable to update user", error);
    return apiError("INTERNAL_ERROR", "Unable to update user", 500);
  }
}
