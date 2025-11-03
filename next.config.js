/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Improve output for Vercel deployment
  outputFileTracingRoot: require('path').join(__dirname),
  
  // Ensure proper chunk loading
  experimental: {
    optimizePackageImports: ['hashconnect', '@hashgraph/sdk'],
  },

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

    // Improve chunk splitting for client-side modules
    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Create a separate chunk for hashconnect to avoid loading issues
          hashconnect: {
            name: 'hashconnect',
            test: /[\\/]node_modules[\\/](hashconnect|@hashgraph)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Keep other vendor chunks separate
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig;