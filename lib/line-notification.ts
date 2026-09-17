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

// Pulls the provider's own error text out of a parsed JSON body, so a thrown LineNotificationError
// carries what the real API said instead of a message we invented. The docs only specify the
// success shape ({"data": "Success"}); on failure this checks the common fields providers use
// (message/error, or a non-"Success" string in data) and falls back to null if none apply.
function extractApiErrorMessage(result: unknown): string | null {
  if (typeof result !== "object" || result === null) return null;
  const record = result as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.data === "string" && record.data.trim() && record.data !== "Success") {
    return record.data;
  }
  return null;
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
      // Callers (e.g. POST /api/notifications/fon) await this synchronously before responding to the
      // request that triggered it - an unbounded fetch would let a hung provider stall that
      // response indefinitely, even though the loan mutation it's announcing already committed.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new LineNotificationError("Notification API did not respond in time");
    }
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
      extractApiErrorMessage(result) ?? `Notification API returned HTTP ${response.status}`,
      response.status,
    );
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    result.data !== "Success"
  ) {
    throw new LineNotificationError(
      extractApiErrorMessage(result) ?? "Notification API returned an unexpected response",
      response.status,
    );
  }

  return { data: "Success" };
}
