import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Le pilote SQLite compatible Turso reste côté serveur, hors du paquet Next.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  // Permet aux tests E2E de démarrer leur serveur sans partager le cache du serveur de développement.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;
