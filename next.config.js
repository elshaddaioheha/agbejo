/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Improve output for Vercel deployment
  outputFileTracingRoot: require('path').join(__dirname),
  
  // Note: Let Next.js handle chunking automatically to avoid chunk load errors

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
      // Make hashconnect and @hashgraph packages external to prevent SSR bundling
      if (Array.isArray(config.externals)) {
        config.externals.push('hashconnect');
        config.externals.push(/^@hashgraph\//);
      } else {
        config.externals = [config.externals, 'hashconnect', /^@hashgraph\//];
      }
    }

    // Client-side: Prevent chunk splitting for wallet modules
    if (!isServer) {
      config.optimization = config.optimization || {};
      // Use deterministic module IDs to prevent chunk conflicts
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      
      // Ensure wallet-modules chunk is not split further
      const existingSplitChunks = config.optimization.splitChunks || {};
      const existingCacheGroups = existingSplitChunks.cacheGroups || {};
      
      config.optimization.splitChunks = {
        ...existingSplitChunks,
        cacheGroups: {
          ...existingCacheGroups,
          // Prevent further splitting of wallet-modules chunk
          walletModules: {
            test: /[\\/]node_modules[\\/](hashconnect|@hashgraph[\\/]sdk)[\\/]/,
            name: 'wallet-modules',
            chunks: 'async',
            priority: 100,
            enforce: true,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig;