import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import { account, session, user, verification } from './db/schema';

// Connexion par e-mail et mot de passe. Pas d'inscription publique : les comptes sont créés par npm run setup.
// Le secret et l'adresse du site sont lus dans BETTER_AUTH_SECRET et BETTER_AUTH_URL.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'temoin', input: false },
    },
  },
  plugins: [nextCookies()],
});
