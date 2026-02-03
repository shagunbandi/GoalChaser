import type { NextConfig } from "next";
import path from "path";
import { config as loadEnv } from "dotenv";

// Load .env.local from monorepo root so one env file works when running from root
const rootEnv = path.resolve(__dirname, "../../.env.local");
loadEnv({ path: rootEnv });

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  transpilePackages: [
      '@goal-chaser/sdk',
      '@goal-chaser/plugin-study',
      '@goal-chaser/plugin-productivity',
      '@goal-chaser/plugin-finance',
      '@goal-chaser/plugin-travel',
      '@goal-chaser/plugin-period',
      '@goal-chaser/plugin-executive-goal',
      '@goal-chaser/plugin-language-tutor',
    ],
  serverExternalPackages: ['firebase', 'firebase-admin'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  env: {
    // Debug: show what env vars are available at build time
    BUILD_TIME_USE_EMULATOR: process.env.NEXT_PUBLIC_USE_EMULATOR || 'not-set',
    BUILD_TIME_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not-set',
  },
};

export default withPWA(nextConfig);
