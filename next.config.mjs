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
  // This adjusts the minifier to prevent the syntax error
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.minimizer = [
        ...config.optimization.minimizer,
      ];
      config.optimization.minimizer.forEach(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.mangle = {
            ...minimizer.options.terserOptions.mangle,
            safari10: true, // Prevents a class of errors related to variable name reuse
          };
        }
      });
    }
    return config;
  },
};

export default nextConfig;
