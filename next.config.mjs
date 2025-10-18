/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@hashgraph/sdk',
    'hashconnect',
    '@hashgraph/cryptography',
    '@hashgraph/proto',
    'query-string',
    'uint8arrays',
  ],
  // Add the webpack configuration below
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;
