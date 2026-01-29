import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

// Load from parent directory
config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: false,
  },
};

export default nextConfig;
