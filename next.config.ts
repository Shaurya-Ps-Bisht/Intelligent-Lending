import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Remove standalone for App Runner source deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Environment variables configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-lambda'],
  },
};

export default nextConfig;
