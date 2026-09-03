import "server-only";

export type LineNotificationPayload = {
  program: string;
  email: string;
  message: string;
  weblink: string;
  color: string;
};

export type LineNotificationResponse = {
  data: "Success";
};

export type LineNotificationOptions = {
  /** Stable key from the notification outbox, reused for every delivery attempt. */
  idempotencyKey?: string;
};

export class LineNotificationError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LineNotificationError";
  }
}

function getRequiredEnvironmentVariable(name: "NOTIFY_API_URL" | "NOTIFY_API_TOKEN") {
  const value = process.env[name]?.trim();

  if (!value || (value.startsWith("<") && value.endsWith(">"))) {
    throw new LineNotificationError(`Missing required environment variable: ${name}`);
  }

  return value;
}

function validatePayload(payload: LineNotificationPayload) {
  for (const [field, value] of Object.entries(payload)) {
    if (!value.trim()) {
      throw new LineNotificationError(`${field} is required`);
    }
  }

  if (!/^#[0-9a-f]{6}$/i.test(payload.color)) {
    throw new LineNotificationError("color must be a 6-digit HEX color");
  }

  try {
    new URL(payload.weblink);
  } catch {
    throw new LineNotificationError("weblink must be a valid URL");
  }
}

function validateIdempotencyKey(idempotencyKey: string) {
  if (!/^[\x21-\x7e]{1,255}$/.test(idempotencyKey)) {
    throw new LineNotificationError(
      "idempotencyKey must contain 1-255 printable ASCII characters",
    );
  }
}

function getPayloadFingerprint(payload: LineNotificationPayload) {
  return JSON.stringify([
    payload.program,
    payload.email,
    payload.message,
    payload.weblink,
    payload.color,
  ]);
}

type InFlightNotification = {
  fingerprint: string;
  request: Promise<LineNotificationResponse>;
};

// This coalesces concurrent retries in the same server process. The stable key is also
// sent to the provider so retries after a process restart can be deduplicated there.
const inFlightNotifications = new Map<string, InFlightNotification>();

export async function sendLineNotification(
  payload: LineNotificationPayload,
  options: LineNotificationOptions = {},
): Promise<LineNotificationResponse> {
  validatePayload(payload);

  const idempotencyKey = options.idempotencyKey?.trim();

  if (options.idempotencyKey !== undefined) {
    if (!idempotencyKey) {
      throw new LineNotificationError(
        "idempotencyKey must contain 1-255 printable ASCII characters",
      );
    }

    validateIdempotencyKey(idempotencyKey);

    const fingerprint = getPayloadFingerprint(payload);
    const existing = inFlightNotifications.get(idempotencyKey);

    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new LineNotificationError(
          "idempotencyKey cannot be reused with a different notification payload",
        );
      }

      return existing.request;
    }

    const request = sendLineNotificationRequest(payload, idempotencyKey);
    inFlightNotifications.set(idempotencyKey, { fingerprint, request });

    try {
      return await request;
    } finally {
      inFlightNotifications.delete(idempotencyKey);
    }
  }

  return sendLineNotificationRequest(payload);
}

async function sendLineNotificationRequest(
  payload: LineNotificationPayload,
  idempotencyKey?: string,
): Promise<LineNotificationResponse> {
  const endpoint = getRequiredEnvironmentVariable("NOTIFY_API_URL");
  const token = getRequiredEnvironmentVariable("NOTIFY_API_TOKEN");

  try {
    new URL(endpoint);
  } catch {
    throw new LineNotificationError("NOTIFY_API_URL must be a valid URL");
  }

  const requestBody = JSON.stringify(payload);
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: requestBody,
    });
  } catch {
    throw new LineNotificationError("Unable to connect to notification API");
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new LineNotificationError("Notification API returned invalid JSON", response.status);
  }

  if (!response.ok) {
    throw new LineNotificationError(
      `Notification API returned HTTP ${response.status}`,
      response.status,
    );
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    result.data !== "Success"
  ) {
    throw new LineNotificationError("Notification API returned an unexpected response");
  }

  return { data: "Success" };
}
