import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the pnpm-lock.yaml workspace root detection warning
  turbopack: {
    root: __dirname,
  },
  // Allow images from IPFS gateways and Hedera Mirror Node
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.pinata.cloud" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "**.ipfs.dweb.link" },
    ],
  },
};

export default nextConfig;
