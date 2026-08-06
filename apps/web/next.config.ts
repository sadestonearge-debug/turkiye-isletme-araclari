import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@tia/ai-core", "@tia/tool-registry"],
};

export default nextConfig;
