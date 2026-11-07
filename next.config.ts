import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Membenarkan build untuk melepasi ralat jenis TypeScript secara paksa
    ignoreBuildErrors: true,
  },
  eslint: {
    // Abaikan amaran ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;