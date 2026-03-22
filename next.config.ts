import type { NextConfig } from "next";
import webpack from "webpack";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer/"),
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
