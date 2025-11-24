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
        source: "/api/auth/logout",
        destination: `${apiBaseUrl}/api/auth/logout`,
      },
    ];
  },
};

export default nextConfig;
