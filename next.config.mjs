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
};

export default nextConfig;
