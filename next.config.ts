import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${apiBaseUrl}/oauth2/:path*`,
      },
      {
        source: "/open-api/:path*",
        destination: `${apiBaseUrl}/open-api/:path*`,
      },
    ];
  },
};

export default nextConfig;
