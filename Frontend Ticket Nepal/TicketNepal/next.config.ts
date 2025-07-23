import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Allow your backend images
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/images/**',
      },
      // Placehold.co for dev/placeholder images
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // (Add production backend domain here if you deploy)
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-backend.com',
      //   port: '',
      //   pathname: '/uploads/images/**',
      // },
    ],
  },
};

export default nextConfig;
