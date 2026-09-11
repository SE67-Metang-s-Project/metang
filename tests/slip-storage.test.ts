// lib/slip-storage.ts imports "server-only", which throws unless the "react-server" export
// condition is set (normally done by Next's bundler).
// Run with: NODE_OPTIONS="--conditions=react-server" npx tsx --test tests/slip-storage.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSlipPath,
  signSlipUrl,
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
    buildSlipPath({ kind: "repayment", loanId: "L002", ext: "pdf" }),
    /^repayment\/L002-\d{8}T\d{9}Z\.pdf$/,
  );
});

test("uploadSlip rejects an unsupported content type before touching the network", async () => {
  await assert.rejects(
    () => uploadSlip({ path: "repayment/L001/x.gif", contentType: "image/gif", bytes: new Uint8Array(1) }),
    SlipStorageError,
  );
});

test("uploadSlip rejects a payload over the 10MB limit before touching the network", async () => {
  await assert.rejects(
    () =>
      uploadSlip({
        path: "repayment/L001/x.jpg",
        contentType: "image/jpeg",
        bytes: new Uint8Array(10 * 1024 * 1024 + 1),
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

test("signSlipUrl prefixes the returned signedURL with the storage v1 base", async () => {
  const restore = mockFetch((url) => {
    assert.equal(
      url,
      "https://test-project.supabase.co/storage/v1/object/sign/bank_payment_slips/repayment/L001/x.jpg",
    );
    return new Response(
      JSON.stringify({ signedURL: "/object/sign/bank_payment_slips/repayment/L001/x.jpg?token=abc" }),
      { status: 200 },
    );
  });

  try {
    const signed = await signSlipUrl({ path: "repayment/L001/x.jpg" });
    assert.equal(
      signed,
      "https://test-project.supabase.co/storage/v1/object/sign/bank_payment_slips/repayment/L001/x.jpg?token=abc",
    );
  } finally {
    restore();
  }
});

test("signSlipUrl throws when Supabase Storage returns a non-OK response", async () => {
  const restore = mockFetch(() => new Response(null, { status: 403 }));
  try {
    await assert.rejects(() => signSlipUrl({ path: "repayment/L001/x.jpg" }), SlipStorageError);
  } finally {
    restore();
  }
});
