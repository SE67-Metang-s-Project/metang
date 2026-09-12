// lib/email-api/client.ts imports "server-only", which throws unless the
// "react-server" export condition is set (normally done by Next's bundler).
// Run with: NODE_OPTIONS="--conditions=react-server" npx tsx --test tests/email-api-client.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { EmailApiError } from "../lib/email-api/types";

const TEST_ENV = {
  EMAIL_API_URL: "https://mis.nurse.cmu.ac.th/thesis",
  EMAIL_API_CLIENT_ID: "test-client-id",
  EMAIL_API_CLIENT_SECRET: "test-client-secret",
};

const BASE_PAYLOAD = {
  subject: "แจ้งเตือนทดสอบ",
  sentTo: "student@cmu.ac.th",
  message: "สวัสดีครับ",
  systemName: "TestSystem",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function mockFetch(handler: FetchHandler) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init?: RequestInit) =>
    handler(String(url), init)) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function freshClient() {
  process.env.EMAIL_API_URL = TEST_ENV.EMAIL_API_URL;
  process.env.EMAIL_API_CLIENT_ID = TEST_ENV.EMAIL_API_CLIENT_ID;
  process.env.EMAIL_API_CLIENT_SECRET = TEST_ENV.EMAIL_API_CLIENT_SECRET;

  // Cache-bust so each test gets its own module instance (fresh tokenCache/refreshInFlight),
  // since the client keeps that state in module-level closures.
  const { sendEmail } = await import(`../lib/email-api/client.ts?test=${Math.random()}`);
  return sendEmail as (payload: typeof BASE_PAYLOAD) => Promise<{ success: true; message: string }>;
}

test("sendEmail succeeds on a valid token and 200 response", async () => {
  const sendEmail = await freshClient();
  let getTokenCalls = 0;
  let sendEmailCalls = 0;

  const restore = mockFetch((url) => {
    if (url.endsWith("/EmailApi/GetToken")) {
      getTokenCalls += 1;
      return jsonResponse({
        success: true,
        access_token: "tok-1",
        token_type: "Bearer",
        expires_in: 86400,
      });
    }
    if (url.endsWith("/EmailApi/SendEmail")) {
      sendEmailCalls += 1;
      return jsonResponse({ success: true, message: "Email sent successfully" });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  try {
    const result = await sendEmail(BASE_PAYLOAD);
    assert.deepEqual(result, { success: true, message: "Email sent successfully" });
    assert.equal(getTokenCalls, 1);
    assert.equal(sendEmailCalls, 1);
  } finally {
    restore();
  }
});

test("sendEmail retries once by refreshing the token on a 401 (retryable failure)", async () => {
  const sendEmail = await freshClient();
  let getTokenCalls = 0;
  let sendEmailAttempts = 0;

  const restore = mockFetch((url) => {
    if (url.endsWith("/EmailApi/GetToken")) {
      getTokenCalls += 1;
      return jsonResponse({
        success: true,
        access_token: `tok-${getTokenCalls}`,
        token_type: "Bearer",
        expires_in: 86400,
      });
    }
    if (url.endsWith("/EmailApi/SendEmail")) {
      sendEmailAttempts += 1;
      if (sendEmailAttempts === 1) {
        return jsonResponse({ success: false, message: "Token has expired" }, 401);
      }
      return jsonResponse({ success: true, message: "Email sent successfully" });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  try {
    const result = await sendEmail(BASE_PAYLOAD);
    assert.deepEqual(result, { success: true, message: "Email sent successfully" });
    assert.equal(sendEmailAttempts, 2, "should retry SendEmail exactly once after a 401");
    assert.equal(getTokenCalls, 2, "should force a fresh token before retrying");
  } finally {
    restore();
  }
});

test("sendEmail rejects without retry on a permanent (non-401) failure", async () => {
  const sendEmail = await freshClient();
  let sendEmailAttempts = 0;

  const restore = mockFetch((url) => {
    if (url.endsWith("/EmailApi/GetToken")) {
      return jsonResponse({
        success: true,
        access_token: "tok-1",
        token_type: "Bearer",
        expires_in: 86400,
      });
    }
    if (url.endsWith("/EmailApi/SendEmail")) {
      sendEmailAttempts += 1;
      return jsonResponse({ success: false, message: "Field 'subject' is required" }, 400);
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  try {
    await assert.rejects(
      () => sendEmail(BASE_PAYLOAD),
      (error: unknown) => {
        assert.ok(error instanceof EmailApiError);
        assert.equal(error.message, "Field 'subject' is required");
        assert.equal(error.status, 400);
        return true;
      },
    );
    assert.equal(sendEmailAttempts, 1, "must not retry on a non-401 failure");
  } finally {
    restore();
  }
});

test("a failed token request never leaks the client secret in the thrown error", async () => {
  const sendEmail = await freshClient();

  const restore = mockFetch((url) => {
    if (url.endsWith("/EmailApi/GetToken")) {
      return jsonResponse({ success: false, message: "Invalid client_id or client_secret" }, 401);
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  try {
    await assert.rejects(
      () => sendEmail(BASE_PAYLOAD),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.doesNotMatch(error.message, new RegExp(TEST_ENV.EMAIL_API_CLIENT_SECRET));
        return true;
      },
    );
  } finally {
    restore();
  }
});

test("concurrent sendEmail calls dedupe the token refresh into one GetToken request", async () => {
  const sendEmail = await freshClient();
  let getTokenCalls = 0;

  const restore = mockFetch(async (url) => {
    if (url.endsWith("/EmailApi/GetToken")) {
      getTokenCalls += 1;
      // Simulate network latency so the concurrent calls below actually overlap.
      await new Promise((resolve) => setTimeout(resolve, 20));
      return jsonResponse({
        success: true,
        access_token: "tok-1",
        token_type: "Bearer",
        expires_in: 86400,
      });
    }
    if (url.endsWith("/EmailApi/SendEmail")) {
      return jsonResponse({ success: true, message: "Email sent successfully" });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  try {
    const results = await Promise.all([
      sendEmail(BASE_PAYLOAD),
      sendEmail(BASE_PAYLOAD),
      sendEmail(BASE_PAYLOAD),
    ]);

    for (const result of results) {
      assert.deepEqual(result, { success: true, message: "Email sent successfully" });
    }
    assert.equal(getTokenCalls, 1, "concurrent refreshes must coalesce into a single request");
  } finally {
    restore();
  }
});
