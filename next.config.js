/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Fix chunk loading issues on Vercel
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent duplicate chunks and naming conflicts
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }
    
    // Fix for hashconnect and other Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Ensure proper trailing slash handling
  trailingSlash: false,
  
  // Enable SWC minification (faster builds)
  swcMinify: true,
}

module.exports = nextConfig
