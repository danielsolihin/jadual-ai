import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // PERINGATAN: Membenarkan build untuk melepasi ralat jenis TypeScript secara paksa.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Abaikan juga sebarang amaran ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;