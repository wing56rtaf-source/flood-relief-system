/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable Gzip/Brotli compression for high throughput data streaming
  poweredByHeader: false, // Security hardening: strip X-Powered-By
};

export default nextConfig;
