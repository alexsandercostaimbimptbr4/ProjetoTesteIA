import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only the Docker image (see Dockerfile) builds the self-contained server.
  // Locally and in the e2e suite the app is served by `next start`, which
  // does not support the standalone output.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
