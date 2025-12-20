/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@qbos/sight-engine',
    '@qbos/silent-engine-core',
    '@qbos/nextjs-adapter'
  ],
};

export default nextConfig;
