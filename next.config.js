/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      http2: false,
      dns: false,
      child_process: false,
      crypto: false, // Add crypto fallback for hashconnect
      stream: false,
      buffer: false,
      util: false,
      url: false,
      zlib: false,
      path: false,
      os: false,
    };

    // Don't exclude @hashgraph/sdk entirely - just exclude Node.js modules
    // The SDK has a browser-compatible version we can use for transactions

    // For server-side, ensure hashconnect and related modules are not bundled
    if (isServer) {
      config.externals = config.externals || [];
      // Make hashconnect external to prevent SSR bundling
      if (Array.isArray(config.externals)) {
        config.externals.push('hashconnect');
      } else {
        config.externals = [config.externals, 'hashconnect'];
      }
    }

    return config;
  },
}

module.exports = nextConfig;