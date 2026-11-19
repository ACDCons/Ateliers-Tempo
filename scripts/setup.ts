// npm run setup : prépare le projet en une commande, sur Mac comme sur Windows.
// 1. Crée .env.local et .env.test.local à partir de .env.example (secret et mots de passe générés).
// 2. Crée les deux bases SQLite (data/local.sqlite pour vous, data/test.sqlite pour les tests).
// 3. Applique les migrations et ajoute les données fictives et les comptes d'Ella et Yanis.
// 4. Démarre l'historique Git s'il n'existe pas encore.
// On peut le relancer : il ne réécrit rien de ce qui existe déjà.
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../lib/db/schema';

const motDePasse = () => `tempo-${randomBytes(6).toString('hex')}`;

function lireEnv(fichier: string) {
  const valeurs: Record<string, string> = {};
  for (const ligne of readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const m = ligne.match(/^([A-Z_]+)=(.*)$/);
    if (m) valeurs[m[1]] = m[2];
  }
  return valeurs;
}

function ecrireEnv(fichier: string, valeurs: Record<string, string>) {
  const modele = readFileSync('.env.example', 'utf8');
  const contenu = modele.replace(/^([A-Z_]+)=(.*)$/gm, (_l, cle: string, defaut: string) => `${cle}=${valeurs[cle] ?? defaut}`);
  writeFileSync(fichier, contenu);
}

// ---------- 1. Variables ----------
let env: Record<string, string>;
if (existsSync('.env.local')) {
  env = lireEnv('.env.local');
  console.log('✓ .env.local existe déjà : conservé.');
} else {
  env = {
    ...lireEnv('.env.example'),
    BETTER_AUTH_SECRET: randomBytes(32).toString('base64'),
    ELLA_PASSWORD: motDePasse(),
    YANIS_PASSWORD: motDePasse(),
  };
  ecrireEnv('.env.local', env);
  console.log('✓ .env.local créé (secret et mots de passe générés).');
}
if (!existsSync('.env.test.local')) {
  ecrireEnv('.env.test.local', { ...env, DATABASE_URL: 'file:data/test.sqlite' });
  console.log('✓ .env.test.local créé (base de test à part : data/test.sqlite).');
}

// ---------- 2 et 3. Bases, migrations, données ----------
mkdirSync('data', { recursive: true });

async function preparerBase(url: string) {
  const client = createClient({ url });
  const db = drizzle(client, { schema });
  await db.run(sql`PRAGMA foreign_keys = ON`);
  await migrate(db, { migrationsFolder: 'drizzle' });

  const dejaRemplie = (await db.select().from(schema.statuts)).length > 0;
  if (!dejaRemplie) {
    await db.insert(schema.statuts).values([
      { id: 1, libelle: 'Nouveau', ordre: 1 },
      { id: 2, libelle: 'En discussion', ordre: 2 },
      { id: 3, libelle: 'Inscrit', ordre: 3 },
      { id: 4, libelle: 'Perdu', ordre: 4 },
    ]);
    const jour = (n: number) => new Date(Date.now() - n * 86_400_000);
    const ava = { id: crypto.randomUUID(), nom: 'TEST-Ava Exemple', email: 'ava@example.test', telephone: null, creeLe: jour(6) };
    const malik = { id: crypto.randomUUID(), nom: 'TEST-Malik Durand', email: 'malik@example.test', telephone: '06 00 00 00 01', creeLe: jour(4) };
    const chloe = { id: crypto.randomUUID(), nom: 'TEST-Chloé Martin', email: 'chloe@example.test', telephone: null, creeLe: jour(2) };
    await db.insert(schema.contacts).values([ava, malik, chloe]);
    await db.insert(schema.demandes).values([
      { id: crypto.randomUUID(), contactId: ava.id, statutId: 1, message: 'Cours d’essai de piano pour débuter, plutôt le mercredi.', creeLe: jour(6) },
      { id: crypto.randomUUID(), contactId: ava.id, statutId: 2, message: 'Et un essai de chant pour ma fille de 12 ans ?', note: 'Rappeler jeudi', creeLe: jour(5) },
      { id: crypto.randomUUID(), contactId: malik.id, statutId: 3, message: 'Guitare électrique, niveau intermédiaire.', creeLe: jour(4) },
      { id: crypto.randomUUID(), contactId: chloe.id, statutId: 4, message: 'Chant en groupe le samedi matin.', creeLe: jour(2) },
    ]);

    // Comptes : créés comme le ferait Better Auth (mot de passe haché), sans inscription publique.
    const auth = betterAuth({
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      database: drizzleAdapter(db, { provider: 'sqlite', schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
      emailAndPassword: { enabled: true },
      user: { additionalFields: { role: { type: 'string', required: false, defaultValue: 'temoin', input: false } } },
    });
    const ctx = await auth.$context;
    for (const compte of [
      { name: 'Ella', email: env.ELLA_EMAIL, password: env.ELLA_PASSWORD, role: 'gestionnaire' },
      { name: 'Yanis', email: env.YANIS_EMAIL, password: env.YANIS_PASSWORD, role: 'temoin' },
    ]) {
      const cree = await ctx.internalAdapter.createUser({ name: compte.name, email: compte.email, emailVerified: true }, { method: 'email-password' });
      await ctx.internalAdapter.linkAccount({ userId: cree.id, providerId: 'credential', accountId: cree.id, password: await ctx.password.hash(compte.password) });
      await db.update(schema.user).set({ role: compte.role }).where(eq(schema.user.id, cree.id));
    }
  }
  client.close();
  return dejaRemplie;
}

const localDejaRemplie = await preparerBase(env.DATABASE_URL || 'file:data/local.sqlite');
console.log(localDejaRemplie ? '✓ data/local.sqlite existe déjà : migrations appliquées, données conservées.' : '✓ data/local.sqlite créée et remplie (données TEST-, comptes).');
await preparerBase('file:data/test.sqlite');
console.log('✓ data/test.sqlite prête pour les tests.');

// ---------- 4. Git ----------
if (!existsSync('.git')) {
  try {
    execSync('git init -b main', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "Départ Ateliers Tempo"', { stdio: 'ignore' });
    console.log('✓ Historique Git démarré : premier commit « Départ Ateliers Tempo ».');
  } catch {
    console.log('! Git n’a pas pu faire le premier commit (nom ou e-mail Git non réglé ?). Demandez à l’agent de le faire.');
  }
}

console.log(`
Prêt. Lancez maintenant : npm run dev
Puis connectez-vous sur http://localhost:3000/connexion

  Ella (gestionnaire) : ${env.ELLA_EMAIL} · ${env.ELLA_PASSWORD}
  Yanis (accès limité) : ${env.YANIS_EMAIL} · ${env.YANIS_PASSWORD}

Ces mots de passe fictifs sont rangés dans .env.local (jamais sur GitHub).`);
