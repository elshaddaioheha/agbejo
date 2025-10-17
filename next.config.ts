import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@hashgraph/sdk', 'hashconnect'],
};

export default nextConfig;