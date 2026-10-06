import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() { return [
    { source: '/auth-api/:path*', destination: 'http://31.97.56.148:3110/:path*' },
  ] },
  /* config options here */
};

export default nextConfig;
