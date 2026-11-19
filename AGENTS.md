# Règles · Les Ateliers Tempo

## Où lire
- Besoin d’Ella : docs/besoin.md. Reprise : docs/journal.md.
- Tables : lib/db/schema.ts (Drizzle). Migrations : drizzle/, générées par `npm run db:generate`, appliquées par `npm run db:migrate`.
- Règles métier et données : lib/demandes.ts. Accès : lib/acces.ts. Connexion : lib/auth.ts (Better Auth).

## Façon de travailler
- Présenter un plan, puis attendre mon accord avant d’installer, de modifier, de migrer ou de lancer une commande.
- Expliquer en français simple ce qui change et pourquoi. Ne rien inventer : si quelque chose n’a pas été lancé ou observé, le dire.
- Ne jamais lire ni afficher .env.local ou .env.test.local, ni écrire un secret ou un mot de passe dans le code, le chat ou Git.

## Règles du projet
- SQLite côté serveur, pilote compatible Turso (@libsql/client). Base de travail : data/local.sqlite. Base des tests : data/test.sqlite, à part, jamais la base de travail.
- Données fictives uniquement, repérables (préfixe TEST-).
- Un contact peut avoir plusieurs demandes ; chaque demande a un contact et un statut (Nouveau, En discussion, Inscrit, Perdu). Le même e-mail, avec ou sans majuscules, désigne un seul contact.
- Supprimer une demande ne supprime jamais le contact ni ses autres demandes.
- Rôles : Ella est gestionnaire (lit, ajoute, modifie, supprime les demandes). Yanis a un accès limité : il ouvre le CRM mais ne voit et ne modifie aucune demande. Un visiteur non connecté est renvoyé vers /connexion. Les droits se vérifient côté serveur, sur chaque page et chaque action privée.
- Pas d’inscription publique : les comptes sont créés par `npm run setup`.
- Un changement de structure passe par une migration ; on conserve les données.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
