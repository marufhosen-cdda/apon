import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * next-intl needs its plugin registered so Server Components can resolve
 * `i18n/request.ts` (the default path) — without it every translated route
 * throws "Couldn't find next-intl config file" at request time.
 */
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // APON reads live data from Postgres on every request; classic dynamic
  // rendering keeps Server Components + Server Actions predictable.
  cacheComponents: false,
  experimental: {
    // Enables `forbidden()` / `forbidden.tsx` for role-based 403 pages.
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Unsplash serves already-optimised derivatives; keep formats light.
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
