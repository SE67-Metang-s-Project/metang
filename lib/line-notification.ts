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

export async function sendLineNotification(
  payload: LineNotificationPayload,
): Promise<LineNotificationResponse> {
  validatePayload(payload);

  const endpoint = getRequiredEnvironmentVariable("NOTIFY_API_URL");
  const token = getRequiredEnvironmentVariable("NOTIFY_API_TOKEN");

  try {
    new URL(endpoint);
  } catch {
    throw new LineNotificationError("NOTIFY_API_URL must be a valid URL");
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
