import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Le pilote SQLite compatible Turso reste côté serveur, hors du paquet Next.
  serverExternalPackages: ['@libsql/client', 'libsql'],
};

export default nextConfig;
