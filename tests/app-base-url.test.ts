import test from "node:test";
import assert from "node:assert/strict";
import { getAppBaseUrl } from "../lib/app-base-url";

test("throws Error('APP_BASE_URL is not set') when unset in production", () => {
  assert.throws(
    () => getAppBaseUrl({ NODE_ENV: "production" }),
    {
      name: "Error",
      message: "APP_BASE_URL is not set",
    },
  );
});

test("throws Error('APP_BASE_URL is not set') when empty or whitespace in production", () => {
  assert.throws(
    () => getAppBaseUrl({ NODE_ENV: "production", APP_BASE_URL: "" }),
    {
      name: "Error",
      message: "APP_BASE_URL is not set",
    },
  );
  assert.throws(
    () => getAppBaseUrl({ NODE_ENV: "production", APP_BASE_URL: "   " }),
    {
      name: "Error",
      message: "APP_BASE_URL is not set",
    },
  );
});

test("returns http://localhost:8080 when unset in development", () => {
  assert.equal(getAppBaseUrl({ NODE_ENV: "development" }), "http://localhost:8080");
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "development", APP_BASE_URL: "" }),
    "http://localhost:8080",
  );
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "development", APP_BASE_URL: "   " }),
    "http://localhost:8080",
  );
  assert.equal(getAppBaseUrl({}), "http://localhost:8080");
});

test("returns trimmed set value in both production and development", () => {
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "production", APP_BASE_URL: "  https://metang.example.com  " }),
    "https://metang.example.com",
  );
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "development", APP_BASE_URL: "  https://metang.example.com  " }),
    "https://metang.example.com",
  );
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "production", APP_BASE_URL: "http://localhost:3000" }),
    "http://localhost:3000",
  );
  assert.equal(
    getAppBaseUrl({ NODE_ENV: "development", APP_BASE_URL: "http://localhost:3000" }),
    "http://localhost:3000",
  );
});
