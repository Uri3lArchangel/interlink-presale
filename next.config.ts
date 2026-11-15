import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  // Two root layouts (Interlink at /, ArkPlay at /arkplay) need a standalone 404 for unmatched URLs.
  experimental: { globalNotFound: true },
};

export default nextConfig;
