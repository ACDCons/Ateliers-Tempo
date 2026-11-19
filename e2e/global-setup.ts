import { randomBytes } from 'node:crypto';
import { createClient } from '@libsql/client';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../lib/db/schema';

const E2E_EMAILS = {
  ella: 'test-ella-e2e@example.test',
  yanis: 'test-yanis-e2e@example.test',
};

export default async function prepareE2EAccounts() {
  const client = createClient({ url: 'file:data/test.sqlite' });
  const db = drizzle(client, { schema });
  const testAuth = betterAuth({
    secret: randomBytes(32).toString('base64'),
    baseURL: 'http://localhost:3100',
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'temoin', input: false },
      },
    },
  });

  try {
    await db.delete(schema.demandes);
    await db.delete(schema.contacts);
    await db.delete(schema.statuts);
    await db.insert(schema.statuts).values([
      { id: 1, libelle: 'Nouveau', ordre: 1 },
      { id: 2, libelle: 'En discussion', ordre: 2 },
      { id: 3, libelle: 'Inscrit', ordre: 3 },
      { id: 4, libelle: 'Perdu', ordre: 4 },
    ]);

    const context = await testAuth.$context;
    for (const [cle, role, nom] of [
      ['ella', 'gestionnaire', 'TEST-Ella E2E'],
      ['yanis', 'temoin', 'TEST-Yanis E2E'],
    ] as const) {
      const email = E2E_EMAILS[cle];
      const [existant] = await db.select().from(schema.user)
        .where(sql`lower(${schema.user.email}) = ${email.toLowerCase()}`);
      if (existant) {
        await db.delete(schema.session).where(eq(schema.session.userId, existant.id));
        await db.delete(schema.account).where(eq(schema.account.userId, existant.id));
        await db.delete(schema.user).where(eq(schema.user.id, existant.id));
      }

      const password = randomBytes(24).toString('base64url');
      const utilisateur = await context.internalAdapter.createUser(
        { name: nom, email, emailVerified: true },
        { method: 'email-password' },
      );
      await context.internalAdapter.linkAccount({
        userId: utilisateur.id,
        providerId: 'credential',
        accountId: utilisateur.id,
        password: await context.password.hash(password),
      });
      await db.update(schema.user).set({ role }).where(eq(schema.user.id, utilisateur.id));

      process.env[`E2E_${cle.toUpperCase()}_EMAIL`] = email;
      process.env[`E2E_${cle.toUpperCase()}_PASSWORD`] = password;
    }
  } finally {
    client.close();
  }
}
