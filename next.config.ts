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
