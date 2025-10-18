/** @type {import('next').NextConfig} */
const nextConfig = {
  // This line tells Next.js to use the SWC minifier instead of Terser
  swcMinify: true, 
  
  transpilePackages: [
    '@hashgraph/sdk',
    'hashconnect',
    '@hashgraph/cryptography',
    '@hashgraph/proto',
    'query-string',
    'uint8arrays',
  ],
};

export default nextConfig;
