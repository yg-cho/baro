import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: E2E hits the dev server via 127.0.0.1 (127.0.0.2/localhost are
  // squatted or mismatched on this box) — Next 16 blocks cross-origin dev
  // asset/HMR requests by default, which silently prevents hydration.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
