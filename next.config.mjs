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
    // This forces the build to use a single instance of these libraries,
    // which can resolve deep dependency conflicts during minification.
    config.resolve.alias = {
      ...config.resolve.alias,
      'long': require.resolve('long'),
      'protobufjs': require.resolve('protobufjs/minimal'),
    };
    return config;
  },
};

export default nextConfig;
