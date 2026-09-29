// The browser-declared File.type is whatever the client sends, so a slip's real type is read from
// its first bytes instead. Pure (no "server-only") so it can be unit tested directly.
// Raster images a browser can show only: SVG can carry script and the slip routes serve it from
// the app's own origin, and HEIC/TIFF would upload fine but not render for the admin reviewing it.
export type SlipContentType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/bmp"
  | "image/avif";

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));
const ANY = null; // a byte whose value doesn't matter (a length field)

const SLIP_SIGNATURES: ReadonlyArray<{ contentType: SlipContentType; bytes: readonly (number | null)[] }> = [
  { contentType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { contentType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { contentType: "image/gif", bytes: ascii("GIF8") }, // GIF87a / GIF89a
  { contentType: "image/webp", bytes: [...ascii("RIFF"), ANY, ANY, ANY, ANY, ...ascii("WEBP")] },
  { contentType: "image/bmp", bytes: ascii("BM") },
  { contentType: "image/avif", bytes: [ANY, ANY, ANY, ANY, ...ascii("ftypavif")] },
  { contentType: "image/avif", bytes: [ANY, ANY, ANY, ANY, ...ascii("ftypavis")] },
];

const SIGNATURE_LENGTH = Math.max(...SLIP_SIGNATURES.map(({ bytes }) => bytes.length));

/**
 * Detects a slip's image type from its leading bytes, or null when the file is none of the
 * allowed types - whatever its declared type says. Reads only the first few bytes.
 */
export async function detectSlipContentType(file: Blob): Promise<SlipContentType | null> {
  const head = new Uint8Array(await file.slice(0, SIGNATURE_LENGTH).arrayBuffer());
  const match = SLIP_SIGNATURES.find(({ bytes }) =>
    bytes.every((byte, index) => index < head.length && (byte === ANY || head[index] === byte)),
  );
  return match?.contentType ?? null;
}
