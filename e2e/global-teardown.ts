import { createClient } from '@libsql/client';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../lib/db/schema';

export default async function removeE2EAccounts() {
  const client = createClient({ url: 'file:data/test.sqlite' });
  const db = drizzle(client, { schema });

  try {
    for (const email of ['test-ella-e2e@example.test', 'test-yanis-e2e@example.test']) {
      const [utilisateur] = await db.select().from(schema.user)
        .where(sql`lower(${schema.user.email}) = ${email.toLowerCase()}`);
      if (utilisateur) {
        await db.delete(schema.session).where(eq(schema.session.userId, utilisateur.id));
        await db.delete(schema.account).where(eq(schema.account.userId, utilisateur.id));
        await db.delete(schema.user).where(eq(schema.user.id, utilisateur.id));
      }
    }
  } finally {
    client.close();
  }
}
