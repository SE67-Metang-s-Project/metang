import "server-only";

// ponytail: plain fetch against the Supabase Storage REST API, no @supabase/supabase-js -
// three small HTTP calls don't need a client SDK dependency.
const SLIP_BUCKET = process.env.SUPABASE_SLIP_BUCKET ?? "bank_payment_slips";

const ALLOWED_SLIP_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const MAX_SLIP_BYTES = 10 * 1024 * 1024;

const SLIP_CONTENT_TYPE_EXTENSIONS: Record<(typeof ALLOWED_SLIP_CONTENT_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

/** Maps a slip's content type to a file extension, or null if it is not an allowed slip type. */
export function extensionForSlipContentType(contentType: string): string | null {
  return (SLIP_CONTENT_TYPE_EXTENSIONS as Record<string, string>)[contentType] ?? null;
}

// "disbursement" holds transfer-out evidence an admin uploads; "repayment" holds evidence a
// student uploads.
export type SlipKind = "disbursement" | "repayment";

export class SlipStorageError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SlipStorageError";
  }
}

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new SlipStorageError(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Builds the storage object path for a slip, named `<loanId>-<upload timestamp>`. The timestamp
 * makes every upload attempt a fresh object: Supabase Storage rejects a POST to an existing key
 * with HTTP 400, so a retry after a failed disbursement would otherwise collide with the slip the
 * failed attempt already stored. The caller must resolve this path and upload the slip BEFORE
 * inserting the owning row - fund_transaction is append-only (see the fund_ledger_invariants
 * migration), so the path must already be known at insert time.
 */
export function buildSlipPath({
  kind,
  loanId,
  ext,
}: {
  kind: SlipKind;
  loanId: string;
  ext: string;
}): string {
  const stamp = new Date().toISOString().replaceAll(/[-:.]/g, "");
  return `${kind}/${loanId}-${stamp}.${ext}`;
}

export async function uploadSlip({
  path,
  contentType,
  bytes,
}: {
  path: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<void> {
  if (!(ALLOWED_SLIP_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    throw new SlipStorageError(`Unsupported slip content type: ${contentType}`);
  }
  if (bytes.byteLength > MAX_SLIP_BYTES) {
    throw new SlipStorageError(`Slip exceeds the ${MAX_SLIP_BYTES}-byte limit`);
  }

  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${SLIP_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "content-type": contentType,
    },
    // ponytail: @types/node's generic Uint8Array<ArrayBufferLike> vs. lib.dom's BodyInit is a
    // known TS typing friction point; Uint8Array is a valid fetch body at runtime.
    body: bytes as BodyInit,
  });

  if (!response.ok) {
    throw new SlipStorageError(
      `Supabase Storage upload failed with HTTP ${response.status}: ${await response.text()}`,
      response.status,
    );
  }
}

export async function signSlipUrl({
  path,
  expiresInSeconds = 300,
}: {
  path: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/${SLIP_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  if (!response.ok) {
    throw new SlipStorageError(
      `Supabase Storage sign failed with HTTP ${response.status}: ${await response.text()}`,
      response.status,
    );
  }

  const result = (await response.json()) as { signedURL?: string };
  if (!result.signedURL) {
    throw new SlipStorageError("Supabase Storage sign response is missing signedURL");
  }

  return `${supabaseUrl}/storage/v1${result.signedURL}`;
}
