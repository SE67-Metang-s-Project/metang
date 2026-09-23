import { getPublicSystemSetting } from "@/db/queries/system-settings";
import { apiError, apiOk } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

/**
 * Read the system-wide bank account and contact block shown to every signed-in user (student
 * repayment details, office contact information). Never includes editor identity or timestamps.
 * @tag System settings
 * @auth cookieAuth
 * @response 200:SystemSettingPublicResponse
 * @add 401:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  try {
    const setting = await getPublicSystemSetting();
    if (!setting) return apiError("INTERNAL_ERROR", "System settings are not initialized", 500);
    return apiOk(serializeJson(setting));
  } catch (error) {
    console.error("Unable to read system settings", error);
    return apiError("INTERNAL_ERROR", "Unable to read system settings", 500);
  }
}
