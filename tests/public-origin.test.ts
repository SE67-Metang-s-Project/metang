import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicOrigin } from "../lib/public-origin";
import { isSameOrigin } from "../lib/request-security";

const request = (headers: Record<string, string>, url = "https://127.0.0.1:3000/metang/api/x") =>
  new Request(url, { headers });

test("the public origin comes from X-Forwarded-Host and X-Forwarded-Proto", () => {
  const forwarded = request({
    "x-forwarded-host": "metang.example.org",
    "x-forwarded-proto": "https",
    host: "127.0.0.1:3000",
  });
  assert.equal(getPublicOrigin(forwarded), "https://metang.example.org");
});

test("Host is used when there is no X-Forwarded-Host, with the protocol of request.url", () => {
  assert.equal(getPublicOrigin(request({ host: "metang.example.org" })), "https://metang.example.org");
  assert.equal(
    getPublicOrigin(request({ host: "localhost:8080" }, "http://localhost:3000/x")),
    "http://localhost:8080",
  );
});

test("the first value of a header list is used, and a default port is dropped", () => {
  const chain = request({
    "x-forwarded-host": "metang.example.org:443, proxy.internal",
    "x-forwarded-proto": "https, http",
  });
  assert.equal(getPublicOrigin(chain), "https://metang.example.org");
});

test("without headers, or with a header that is not a host, request.url is used", () => {
  assert.equal(getPublicOrigin(request({})), "https://127.0.0.1:3000");
  assert.equal(getPublicOrigin(request({ "x-forwarded-host": "bad host/x" })), "https://127.0.0.1:3000");
});

test("isSameOrigin accepts the public origin behind a proxy and rejects another site", () => {
  const proxied = {
    "x-forwarded-host": "metang.example.org",
    "x-forwarded-proto": "https",
  };
  assert.equal(isSameOrigin(request({ ...proxied, origin: "https://metang.example.org" })), true);
  assert.equal(isSameOrigin(request({ ...proxied, origin: "https://evil.example" })), false);
  assert.equal(isSameOrigin(request({ ...proxied, origin: "https://127.0.0.1:3000" })), false);
  assert.equal(isSameOrigin(request({ ...proxied, referer: "https://metang.example.org/metang/x" })), true);
});
