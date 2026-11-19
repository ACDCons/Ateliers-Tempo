import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Lit .env.local s'il existe (créé par npm run setup).
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export default defineConfig({
  // « turso » = SQLite avec le pilote compatible Turso : fichier local aujourd'hui, Turso en ligne demain.
  dialect: 'turso',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:data/local.sqlite',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
