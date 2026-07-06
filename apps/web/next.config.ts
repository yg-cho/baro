import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E drives the dev server via 127.0.0.1; Next dev blocks cross-origin
  // asset requests unless allowed here.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
