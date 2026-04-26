import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.nhle.com",
      },
      {
        protocol: "https",
        hostname: "assets.leaguestat.com",
      },
      {
        protocol: "https",
        hostname: "assets.thepwhl.com",
      },
    ],
  },
};

export default nextConfig;