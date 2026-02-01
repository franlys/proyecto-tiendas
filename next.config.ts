import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "videos.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Force static routes to have priority over dynamic [shopId]
  async rewrites() {
    return {
      beforeFiles: [
        // Ensure /agency/* routes are not captured by [shopId]
        {
          source: "/agency/:path*",
          destination: "/agency/:path*",
        },
        // Ensure /admin/* routes are not captured by [shopId]
        {
          source: "/admin/:path*",
          destination: "/admin/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
