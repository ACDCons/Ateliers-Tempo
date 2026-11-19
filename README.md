# Les Ateliers Tempo

Site et CRM de l’école de musique d’Ella (cas fictif du soir 4). Déjà fait : la landing avec son formulaire de cours d’essai, le CRM (lire, ajouter, modifier, supprimer) et la connexion (Ella gestionnaire, Yanis accès limité). Pas encore fait : les tests.

## Démarrer : trois commandes

Ouvrez un terminal **dans ce dossier** (`ateliers-tempo`, pas le dossier qui l’enveloppe), puis :

```
npm install
npm run setup
npm run dev
```

1. `npm install` télécharge les outils du projet dans `node_modules` (quelques minutes la première fois).
2. `npm run setup` crée vos réglages (`.env.local`, `.env.test.local`), les deux bases (`data/local.sqlite` pour vous, `data/test.sqlite` pour les tests), les données fictives et les comptes, puis démarre l’historique Git. À la fin, il affiche les identifiants d’Ella et de Yanis.
3. `npm run dev` lance le site : ouvrez http://localhost:3000. Laissez ce terminal ouvert.

Vérifiez : le formulaire s’affiche, Ella se connecte sur /connexion, le CRM montre les demandes fictives.

**Le site s’ouvre sur un autre port que 3000** (le terminal affiche par exemple `localhost:3001`) ? Un autre programme occupe déjà le port 3000, et la connexion d’Ella échouera. Arrêtez l’autre site (Ctrl + C dans son terminal), puis relancez `npm run dev`.

## Autres commandes

- `npm run db:studio` : regarder la base dans Drizzle Studio (Chrome), dans un deuxième terminal.
- `npm run lint` · `npm run build` : déjà disponibles. Les commandes de tests seront ajoutées ce soir.
