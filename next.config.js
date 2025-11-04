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

    // Client-side: Let webpack magic comments handle chunking
    // The webpackChunkName comments in lib/wallets.ts and components/WalletProvider.tsx
    // will ensure all wallet-related modules load from the same "wallets" chunk
    // We don't need custom splitChunks config - it can interfere with Next.js vendor chunks

    return config;
  },
}

module.exports = nextConfig;