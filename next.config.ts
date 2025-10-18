import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add all these packages to transpilePackages
  transpilePackages: [
    '@hashgraph/sdk',
    'hashconnect',
    '@hashgraph/cryptography',
    '@hashgraph/proto',
    'query-string',
    'uint8arrays',
  ],
};

export default nextConfig;
