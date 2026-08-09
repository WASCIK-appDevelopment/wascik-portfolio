import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/wascik-logo-v2.png",
        search: "?v=20260809",
      },
      {
        pathname: "/michael-wascik-full-v2.png",
      },
    ],
  },
};

export default nextConfig;
