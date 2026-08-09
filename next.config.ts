import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/wascik-logo-v2.png",
        search: "?v=20260809",
      },
    ],
  },
};

export default nextConfig;
