import type { NextConfig } from "next";
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
  serverExternalPackages: ['firebase', 'firebase-admin'],
  async redirects() {
    return [
      {
        source: '/developer/documentation/storybook',
        destination: '/developer/documentation/storybook/index.html',
        permanent: false,
      },
      {
        source: '/developer/documentation/storybook/',
        destination: '/developer/documentation/storybook/index.html',
        permanent: false,
      },
    ]
  },
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
