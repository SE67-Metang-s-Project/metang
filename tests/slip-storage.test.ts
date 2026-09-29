// lib/slip-storage.ts imports "server-only", which throws unless the "react-server" export
// condition is set (normally done by Next's bundler).
// Run with: NODE_OPTIONS="--conditions=react-server" npx tsx --test tests/slip-storage.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSlipPath,
  MAX_SLIP_BYTES,
  SLIP_CACHE_CONTROL,
  serveSlip,
  slipContentTypeForPath,
  SlipStorageError,
  uploadSlip,
} from "../lib/slip-storage";

process.env.SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SUPABASE_SLIP_BUCKET = "bank_payment_slips";

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init?: RequestInit) =>
    handler(String(url), init)) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test("buildSlipPath composes kind/loanId-timestamp.ext", () => {
  assert.match(
    buildSlipPath({ kind: "disbursement", loanId: "L001", ext: "jpg" }),
    /^disbursement\/L001-\d{8}T\d{9}Z\.jpg$/,
  );
  assert.match(
    buildSlipPath({ kind: "repayment", loanId: "L002", ext: "png" }),
    /^repayment\/L002-\d{8}T\d{9}Z\.png$/,
  );
});

test("uploadSlip rejects an unsupported content type before touching the network", async () => {
  await assert.rejects(
    () => uploadSlip({ path: "repayment/L001/x.svg", contentType: "image/svg+xml", bytes: new Uint8Array(1) }),
    SlipStorageError,
  );
});

test("uploadSlip rejects a payload over the 1MB limit before touching the network", async () => {
  await assert.rejects(
    () =>
      uploadSlip({
        path: "repayment/L001/x.jpg",
        contentType: "image/jpeg",
        bytes: new Uint8Array(MAX_SLIP_BYTES + 1),
      }),
    SlipStorageError,
  );
});

test("uploadSlip POSTs the bytes to the object endpoint with the service role key", async () => {
  let seenUrl = "";
  let seenInit: RequestInit | undefined;
  const restore = mockFetch((url, init) => {
    seenUrl = url;
    seenInit = init;
    return new Response(null, { status: 200 });
  });

  try {
    await uploadSlip({
      path: "repayment/L001/x.jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([1, 2, 3]),
    });
  } finally {
    restore();
  }

  assert.equal(
    seenUrl,
    "https://test-project.supabase.co/storage/v1/object/bank_payment_slips/repayment/L001/x.jpg",
  );
  assert.equal(seenInit?.method, "POST");
  const headers = seenInit?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer test-service-role-key");
  assert.equal(headers.apikey, "test-service-role-key");
});

test("serveSlip streams the object from the authenticated endpoint - no storage URL escapes", async () => {
  let seenUrl = "";
  let seenInit: RequestInit | undefined;
  const restore = mockFetch((url, init) => {
    seenUrl = url;
    seenInit = init;
    // A lying upstream type must not decide what the browser renders.
    return new Response(new Uint8Array([7, 8, 9]), { status: 200, headers: { "content-type": "text/html" } });
  });

  let response: Response;
  try {
    response = await serveSlip({ path: "repayment/L001-x.png" });
  } finally {
    restore();
  }

  assert.equal(
    seenUrl,
    "https://test-project.supabase.co/storage/v1/object/authenticated/bank_payment_slips/repayment/L001-x.png",
  );
  const headers = seenInit?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer test-service-role-key");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), SLIP_CACHE_CONTROL);
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([7, 8, 9]));
});

test("a served slip is cacheable by the browser only", () => {
  assert.match(SLIP_CACHE_CONTROL, /^private, max-age=\d+$/);
});

test("slipContentTypeForPath maps only the allowlisted extensions", () => {
  assert.equal(slipContentTypeForPath("repayment/L001-x.jpg"), "image/jpeg");
  assert.equal(slipContentTypeForPath("repayment/L001-x.png"), "image/png");
  assert.equal(slipContentTypeForPath("repayment/L001-x.webp"), "image/webp");
  // PDF is no longer accepted; an older .pdf slip is served as a download, never rendered inline.
  assert.equal(slipContentTypeForPath("disbursement/L001-x.pdf"), "application/octet-stream");
  assert.equal(slipContentTypeForPath("repayment/L001-x.html"), "application/octet-stream");
  assert.equal(slipContentTypeForPath("repayment/L001-x"), "application/octet-stream");
});

test("serveSlip throws when Supabase Storage returns a non-OK response", async () => {
  const restore = mockFetch(() => new Response(null, { status: 400 }));
  try {
    await assert.rejects(() => serveSlip({ path: "repayment/L001-x.jpg" }), SlipStorageError);
  } finally {
    restore();
  }
});
