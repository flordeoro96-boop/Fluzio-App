import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@opentelemetry/api',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/private/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
