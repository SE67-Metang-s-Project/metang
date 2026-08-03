import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const CMU_SESSION_COOKIE = "cmu_session";
export const CMU_OAUTH_COOKIE = "cmu_oauth_transaction";
export const OAUTH_TRANSACTION_MAX_AGE = 10 * 60;
export const SESSION_MAX_AGE = 8 * 60 * 60;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CmuProfile = Record<string, JsonValue>;

export type CmuSession = {
  profile: CmuProfile;
  loggedInAt: number;
  expiresAt: number;
};

export type OAuthTransaction = {
  state: string;
  codeVerifier: string;
  expiresAt: number;
};

export type CmuAuthConfig = {
  authorizationUrl: string;
  tokenUrl: string;
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  basicInfoUrl: string;
  logoutUrl: string;
};

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value || (value.startsWith("<") && value.endsWith(">"))) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSessionKey() {
  const secret = getRequiredEnvironmentVariable("SESSION_SECRET");

  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  return createHash("sha256").update(secret).digest();
}

function assertValidUrl(value: string, name: string) {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

export function getCmuAuthConfig(): CmuAuthConfig {
  return {
    authorizationUrl: assertValidUrl(
      getRequiredEnvironmentVariable("AUTH_URL"),
      "AUTH_URL",
    ),
    tokenUrl: assertValidUrl(getRequiredEnvironmentVariable("TOKEN_URL"), "TOKEN_URL"),
    callbackUrl: assertValidUrl(
      getRequiredEnvironmentVariable("CALLBACK_URL"),
      "CALLBACK_URL",
    ),
    clientId: getRequiredEnvironmentVariable("CLIENT_ID"),
    clientSecret: getRequiredEnvironmentVariable("CLIENT_SECRET"),
    scope: getRequiredEnvironmentVariable("SCOPE"),
    basicInfoUrl: assertValidUrl(
      getRequiredEnvironmentVariable("BASICINFO_URL"),
      "BASICINFO_URL",
    ),
    logoutUrl: assertValidUrl(
      getRequiredEnvironmentVariable("LOGOUT_URL"),
      "LOGOUT_URL",
    ),
  };
}

export function isCmuAuthConfigured() {
  const requiredVariables = [
    "AUTH_URL",
    "TOKEN_URL",
    "CALLBACK_URL",
    "CLIENT_ID",
    "CLIENT_SECRET",
    "SCOPE",
    "BASICINFO_URL",
    "LOGOUT_URL",
    "SESSION_SECRET",
  ];

  return requiredVariables.every((name) => {
    const value = process.env[name]?.trim();
    return Boolean(value && !(value.startsWith("<") && value.endsWith(">")));
  });
}

export function seal(value: unknown) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), initializationVector);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  return Buffer.concat([initializationVector, authenticationTag, encrypted]).toString("base64url");
}

export function unseal<T>(value: string): T | null {
  try {
    const payload = Buffer.from(value, "base64url");

    if (payload.length < 29) {
      return null;
    }

    const initializationVector = payload.subarray(0, 12);
    const authenticationTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), initializationVector);
    decipher.setAuthTag(authenticationTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createPkcePair() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  return { codeVerifier, codeChallenge };
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function valuesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sanitizeJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return value as string | number | boolean | null;
  }

  if (Array.isArray(value)) {
    return value
      .map(sanitizeJsonValue)
      .filter((entry): entry is JsonValue => entry !== undefined);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) => {
        const sanitizedEntry = sanitizeJsonValue(entry);
        return sanitizedEntry === undefined ? [] : [[key, sanitizedEntry]];
      }),
    );
  }

  return undefined;
}

export function sanitizeCmuProfile(value: unknown): CmuProfile | null {
  const profile = sanitizeJsonValue(value);

  if (!profile || Array.isArray(profile) || typeof profile !== "object") {
    return null;
  }

  return Object.keys(profile).length > 0 ? profile : null;
}

export async function getCmuSession(): Promise<CmuSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(CMU_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  const session = unseal<CmuSession>(sessionCookie);

  if (!session || session.expiresAt <= Date.now() || !session.profile) {
    return null;
  }

  return session;
}

export function getCmuDisplayName(profile: CmuProfile) {
  const fullNameKeys = ["full_name_TH", "full_name_EN", "display_name", "name"];

  for (const key of fullNameKeys) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  const thaiName = [profile.firstname_TH, profile.lastname_TH]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join(" ");

  if (thaiName) {
    return thaiName;
  }

  const englishName = [profile.firstname_EN, profile.lastname_EN]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join(" ");

  if (englishName) {
    return englishName;
  }

  const account = profile.cmuitaccount_name ?? profile.cmuitaccount;
  return typeof account === "string" ? account : "CMU user";
}
