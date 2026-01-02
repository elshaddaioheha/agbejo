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

    // Configure chunking for wallet modules to prevent chunk loading errors
    if (!isServer) {
      // Use deterministic chunk IDs to prevent chunk hash mismatches between builds
      config.optimization = config.optimization || {};
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      
      // Add custom cache groups without explicit names to avoid conflicts
      // Let webpack generate names automatically
      const existingSplitChunks = config.optimization.splitChunks || {};
      const existingCacheGroups = existingSplitChunks.cacheGroups || {};
      
      config.optimization.splitChunks = {
        ...existingSplitChunks,
        cacheGroups: {
          ...existingCacheGroups,
          hashconnect: {
            test: /[\\/]node_modules[\\/]hashconnect[\\/]/,
            // Omit name to let webpack generate it automatically
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          hederaSdk: {
            test: /[\\/]node_modules[\\/]@hashgraph[\\/]/,
            // Omit name to let webpack generate it automatically
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig;