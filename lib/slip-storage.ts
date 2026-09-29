import "server-only";

const SLIP_BUCKET = process.env.SUPABASE_SLIP_BUCKET ?? "bank_payment_slips";

const ALLOWED_SLIP_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/avif",
] as const;
export const MAX_SLIP_BYTES = 1 * 1024 * 1024;

const SLIP_CONTENT_TYPE_EXTENSIONS: Record<(typeof ALLOWED_SLIP_CONTENT_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/avif": "avif",
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
    body: bytes as BodyInit,
  });

  if (!response.ok) {
    throw new SlipStorageError(
      `Supabase Storage upload failed with HTTP ${response.status}: ${await response.text()}`,
      response.status,
    );
  }
}

// Slips are served by the app, never by a storage URL: a signed URL is a bearer link, so anyone it
// reached - a copied address bar, a forwarded chat message - could open the slip with no session
// until it expired. Streaming the bytes keeps every read behind the slip routes' authorization.

/**
 * Cache-Control for a served slip. Only the browser may keep it (private), and it is paired with
 * `Vary: Cookie` so a different or missing session - the next user on a shared browser - misses
 * the cache and is re-authorized.
 */
export const SLIP_CACHE_CONTROL = "private, max-age=300";

/** The type a slip is served as, from the extension buildSlipPath chose - never from storage. */
export function slipContentTypeForPath(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1);
  const match = Object.entries(SLIP_CONTENT_TYPE_EXTENSIONS).find(([, value]) => value === ext);
  return match?.[0] ?? "application/octet-stream";
}

/**
 * Downloads a slip from the private bucket and streams it back as the slip route's 200 response.
 * The caller must have authorized the reader first.
 */
export async function serveSlip({ path }: { path: string }): Promise<Response> {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/authenticated/${SLIP_BUCKET}/${path}`,
    { headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } },
  );

  if (!response.ok) {
    throw new SlipStorageError(
      `Supabase Storage download failed with HTTP ${response.status}: ${await response.text()}`,
      response.status,
    );
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": slipContentTypeForPath(path),
      "Cache-Control": SLIP_CACHE_CONTROL,
      Vary: "Cookie",
      // The slip is now served from the app's own origin: never let the browser sniff an upload
      // whose declared type was a lie into HTML.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
