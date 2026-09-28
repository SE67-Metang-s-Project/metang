// The browser-declared File.type is whatever the client sends, so a slip's real type is read from
// its first bytes instead. Pure (no "server-only") so it can be unit tested directly.
export type SlipContentType = "image/jpeg" | "image/png" | "application/pdf";

const SLIP_SIGNATURES: ReadonlyArray<{ contentType: SlipContentType; bytes: readonly number[] }> = [
  { contentType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { contentType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // "%PDF-"
  { contentType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

const SIGNATURE_LENGTH = Math.max(...SLIP_SIGNATURES.map(({ bytes }) => bytes.length));

/**
 * Detects a slip's content type from its leading bytes (JPEG, PNG or PDF), or null when the file
 * is none of them - whatever its declared type says. Reads only the first few bytes.
 */
export async function detectSlipContentType(file: Blob): Promise<SlipContentType | null> {
  const head = new Uint8Array(await file.slice(0, SIGNATURE_LENGTH).arrayBuffer());
  const match = SLIP_SIGNATURES.find(({ bytes }) =>
    bytes.every((byte, index) => head[index] === byte),
  );
  return match?.contentType ?? null;
}
