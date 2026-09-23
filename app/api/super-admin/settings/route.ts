import {
  getSystemSetting,
  SystemSettingError,
  updateSystemSetting,
} from "@/db/queries/system-settings";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { parseSystemSettingPatch } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

/**
 * Read the system-wide bank and contact settings, including who last edited them.
 * @tag System settings
 * @auth cookieAuth
 * @response 200:SystemSettingResponse
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
    const setting = await getSystemSetting();
    if (!setting) return apiError("INTERNAL_ERROR", "System settings are not initialized", 500);
    return apiOk(serializeJson(setting));
  } catch (error) {
    console.error("Unable to read system settings", error);
    return apiError("INTERNAL_ERROR", "Unable to read system settings", 500);
  }
}

/**
 * Update one or more system-wide bank/contact settings fields. Absent keys are left unchanged.
 * @tag System settings
 * @body SystemSettingBody
 * @auth cookieAuth
 * @response 200:SystemSettingResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
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

  let patch;
  try {
    patch = parseSystemSettingPatch(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  try {
    const setting = await updateSystemSetting({ actorId: access.context.user.id, patch });
    return apiOk(serializeJson(setting));
  } catch (error) {
    if (error instanceof SystemSettingError) {
      if (error.code === "ACCESS_REVOKED") {
        return apiError("CONFLICT", "The request changed; please retry", 409);
      }
      if (error.code === "NOT_INITIALIZED") {
        return apiError("INTERNAL_ERROR", "System settings are not initialized", 500);
      }
    }
    console.error("Unable to update system settings", error);
    return apiError("INTERNAL_ERROR", "Unable to update system settings", 500);
  }
}
