import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/metang",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/metang",
        basePath: false,
        permanent: false,
      },
      {
        source: "/metang-logo7.png",
        destination: "/metang/metang-logo7.png",
        basePath: false,
        permanent: false,
      },
      {
        source: "/metang-logo.png",
        destination: "/metang/metang-logo.png",
        basePath: false,
        permanent: false,
      },
      {
        source: "/bank-logos/:path*",
        destination: "/metang/bank-logos/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/logo-variations/:path*",
        destination: "/metang/logo-variations/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/mock-payment-qr.svg",
        destination: "/metang/mock-payment-qr.svg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/payment-qr.jpg",
        destination: "/metang/payment-qr.jpg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/mock-payment-receipt-1.jpg",
        destination: "/metang/mock-payment-receipt-1.jpg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/mock-payment-receipt-2.jpg",
        destination: "/metang/mock-payment-receipt-2.jpg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/mock-payment-receipt.jpg",
        destination: "/metang/mock-payment-receipt.jpg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/mock-transfer-slip.svg",
        destination: "/metang/mock-transfer-slip.svg",
        basePath: false,
        permanent: false,
      },
      {
        source: "/favicon.ico",
        destination: "/metang/favicon.ico",
        basePath: false,
        permanent: false,
      },
      {
        source: "/icon.png",
        destination: "/metang/icon.png",
        basePath: false,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/metang/admin/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/advisor/:path*",
        destination: "/metang/advisor/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/executive/:path*",
        destination: "/metang/executive/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/superadmin/:path*",
        destination: "/metang/superadmin/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/student/:path*",
        destination: "/metang/student/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/login",
        destination: "/metang/login",
        basePath: false,
        permanent: false,
      },
      {
        source: "/error",
        destination: "/metang/error",
        basePath: false,
        permanent: false,
      },
      {
        source: "/demo/:path*",
        destination: "/metang/demo/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/api-docs",
        destination: "/metang/api-docs",
        basePath: false,
        permanent: false,
      },
      {
        source: "/api/:path*",
        destination: "/metang/api/:path*",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
