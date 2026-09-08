import "server-only";

import { EmailApiError, SendEmailPayload, SendEmailResponse } from "./types";

function getRequiredEnvironmentVariable(
  name: "EMAIL_API_URL" | "EMAIL_API_CLIENT_ID" | "EMAIL_API_CLIENT_SECRET",
) {
  const value = process.env[name]?.trim();

  if (!value || (value.startsWith("<") && value.endsWith(">"))) {
    throw new EmailApiError(`Missing required environment variable: ${name}`);
  }

  return value;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function fetchFreshToken(): Promise<string> {
  const endpoint = getRequiredEnvironmentVariable("EMAIL_API_URL");
  const clientId = getRequiredEnvironmentVariable("EMAIL_API_CLIENT_ID");
  const clientSecret = getRequiredEnvironmentVariable("EMAIL_API_CLIENT_SECRET");

  try {
    new URL(endpoint);
  } catch {
    throw new EmailApiError("EMAIL_API_URL must be a valid URL");
  }

  const requestBody = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
  });

  let response: Response;

  try {
    response = await fetch(`${endpoint.replace(/\/$/, "")}/EmailApi/GetToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
  } catch {
    throw new EmailApiError("Unable to connect to Email API GetToken endpoint");
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new EmailApiError("Email API returned invalid JSON", response.status);
  }

  if (
    !response.ok ||
    (typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success === false)
  ) {
    let errorMessage = `Email API returned HTTP ${response.status}`;
    if (
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
    ) {
      errorMessage = result.message;
    }
    throw new EmailApiError(errorMessage, response.status);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("success" in result) ||
    result.success !== true ||
    !("access_token" in result) ||
    typeof result.access_token !== "string" ||
    !("expires_in" in result) ||
    typeof result.expires_in !== "number"
  ) {
    throw new EmailApiError("Email API returned an unexpected response", response.status);
  }

  tokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1000,
  };

  return tokenCache.token;
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache !== null) {
    const remainingTime = tokenCache.expiresAt - Date.now();
    if (remainingTime > 5 * 60 * 1000) {
      return tokenCache.token;
    }
  }

  return fetchFreshToken();
}

function validatePayload(payload: SendEmailPayload) {
  if (!payload.subject.trim()) {
    throw new EmailApiError("subject is required");
  }
  if (!payload.sentTo.trim()) {
    throw new EmailApiError("sentTo is required");
  }
  if (!payload.message.trim()) {
    throw new EmailApiError("message is required");
  }
  if (!payload.systemName.trim()) {
    throw new EmailApiError("systemName is required");
  }
  if (/\s/.test(payload.systemName)) {
    throw new EmailApiError("systemName must not contain any whitespace");
  }
}

async function sendEmailRequest(
  payload: SendEmailPayload,
  token: string,
): Promise<SendEmailResponse> {
  const endpoint = getRequiredEnvironmentVariable("EMAIL_API_URL");

  try {
    new URL(endpoint);
  } catch {
    throw new EmailApiError("EMAIL_API_URL must be a valid URL");
  }

  const wirePayload: Record<string, string> = {
    subject: payload.subject,
    sent_to: payload.sentTo,
    message: payload.message,
    system_name: payload.systemName,
  };

  if (payload.ccTo !== undefined && payload.ccTo.trim() !== "") {
    wirePayload.cc_to = payload.ccTo;
  }

  const requestBody = JSON.stringify(wirePayload);
  let response: Response;

  try {
    response = await fetch(`${endpoint.replace(/\/$/, "")}/EmailApi/SendEmail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
  } catch {
    throw new EmailApiError("Unable to connect to Email API SendEmail endpoint");
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new EmailApiError("Email API returned invalid JSON", response.status);
  }

  if (
    !response.ok ||
    (typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success === false)
  ) {
    let errorMessage = `Email API returned HTTP ${response.status}`;
    if (
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
    ) {
      errorMessage = result.message;
    }
    throw new EmailApiError(errorMessage, response.status);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("success" in result) ||
    result.success !== true ||
    !("message" in result) ||
    typeof result.message !== "string"
  ) {
    throw new EmailApiError("Email API returned an unexpected response", response.status);
  }

  return { success: true, message: result.message };
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  validatePayload(payload);

  let token = await getAccessToken(false);

  try {
    return await sendEmailRequest(payload, token);
  } catch (error) {
    if (error instanceof EmailApiError && error.status === 401) {
      token = await getAccessToken(true);
      return await sendEmailRequest(payload, token);
    }
    throw error;
  }
}
