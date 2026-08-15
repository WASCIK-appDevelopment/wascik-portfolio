import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Codespaces proxies the local Next dev server through an
  // *.app.github.dev origin. Explicitly allow that development origin so
  // Next's dev-origin protection does not interfere with iPhone/Safari previews.
  allowedDevOrigins: ["*.app.github.dev"],
  images: {
    localPatterns: [
      {
        pathname: "/wascik-logo-v2.png",
        search: "?v=20260809",
      },
      {
        pathname: "/michael-wascik-full-v2.png",
      },
      {
        pathname: "/affiliate/**",
      },
    ],
  },
};

export default nextConfig;
