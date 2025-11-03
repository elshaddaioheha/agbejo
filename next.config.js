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

    // Client-side: ensure hashconnect is not split into problematic chunks
    if (!isServer) {
      // Use Next.js default chunking - don't override
      // Just ensure proper module resolution
      config.resolve.alias = config.resolve.alias || {};
    }

    // Let Next.js handle chunk splitting - don't override with custom config
    // Custom chunk splitting was causing duplicate declarations and missing chunks

    return config;
  },
}

module.exports = nextConfig;