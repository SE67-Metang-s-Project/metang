import { apiError } from "@/lib/api-response";

export function checkCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  return null;
}
