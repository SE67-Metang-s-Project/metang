import path from "node:path";
import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

// Old root paths, each sent with a temporary redirect to the same path under the base path.
const ROOT_PATHS = [
  "/",
  "/metang-logo7.png",
  "/metang-logo.png",
  "/metang-logo-transparent.png",
  "/bank-logos/:path*",
  "/logo-variations/:path*",
  "/mock-payment-qr.svg",
  "/payment-qr.jpg",
  "/mock-payment-receipt-1.jpg",
  "/mock-payment-receipt-2.jpg",
  "/mock-payment-receipt.jpg",
  "/mock-transfer-slip.svg",
  "/favicon.ico",
  "/icon.png",
  "/admin/:path*",
  "/advisor/:path*",
  "/executive/:path*",
  "/superadmin/:path*",
  "/student/:path*",
  "/login",
  "/error",
  "/demo/:path*",
  "/api-docs",
  "/openapi.json",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  basePath: BASE_PATH,
  // Without this, PUBLIC_SUBPATH would reach the server only: Next.js writes only NEXT_PUBLIC_*
  // and `env` values into the browser bundles.
  env: { PUBLIC_SUBPATH: BASE_PATH },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    staleTimes: { dynamic: 60 },
  },
  async redirects() {
    // Served from the root, the old paths are the real paths.
    if (!BASE_PATH) return [];
    return ROOT_PATHS.map((source) => ({
      source,
      destination: source === "/" ? BASE_PATH : `${BASE_PATH}${source}`,
      basePath: false as const,
      permanent: false,
    }));
  },
};

export default nextConfig;
