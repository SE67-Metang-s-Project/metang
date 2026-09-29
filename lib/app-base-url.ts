export function getAppBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const value = env.APP_BASE_URL?.trim();

  if (!value) {
    if (env.NODE_ENV === "production") {
      throw new Error("APP_BASE_URL is not set");
    }
    return "http://localhost:8080";
  }

  return value;
}
