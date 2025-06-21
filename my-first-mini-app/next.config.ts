import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  allowedDevOrigins: [
    'https://destinityworld-psi.vercel.app',
    'https://destinityworld-chernobylntfs-projects.vercel.app',
    'https://destinityworld-git-my-first-mini-app-chernobylntfs-projects.vercel.app',// Tu URL de Vercel añadida aquí
    // Si necesitas otros orígenes para desarrollo local, puedes añadirlos aquí también.
  ],
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
