import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Fichier local en développement (file:data/local.sqlite), Turso en ligne : seule l'adresse change.
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:data/local.sqlite',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// SQLite n'applique les relations (clés étrangères) que si on le lui demande, à chaque connexion.
export async function activerRelations() {
  await db.run(sql`PRAGMA foreign_keys = ON`);
}
