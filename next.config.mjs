import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  transpilePackages: [
    '@hashgraph/sdk',
    'hashconnect',
    '@hashgraph/cryptography',
    '@hashgraph/proto',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'long': require.resolve('long'),
      'protobufjs': require.resolve('protobufjs/minimal'),
    };
    return config;
  },
};

export default nextConfig;
