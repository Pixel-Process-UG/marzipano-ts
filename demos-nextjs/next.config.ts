import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // External packages for server components
  serverExternalPackages: ['marzipano'],
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
