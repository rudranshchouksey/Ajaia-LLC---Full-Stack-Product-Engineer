import type { NextConfig } from "next";

// Note: `cacheComponents` / `partialPrefetching` (enabled by the create-next-app
// template) are intentionally off. Every page here is per-user and reads the
// session cookie, so there is no static shell worth prerendering, and classic
// dynamic rendering keeps the auth code simple.
const nextConfig: NextConfig = {
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
