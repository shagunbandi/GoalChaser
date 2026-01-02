/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure env vars are available in browser
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
  },
  env: {
    // Debug: show what env vars are available at build time
    BUILD_TIME_USE_EMULATOR: process.env.NEXT_PUBLIC_USE_EMULATOR || 'not-set',
    BUILD_TIME_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not-set',
  },
}

export default nextConfig
