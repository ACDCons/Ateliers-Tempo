# Plan de tests — Les Ateliers Tempo

Liste validée ; les priorités indiquent l’ordre conseillé. `[x]` signifie qu’un test automatisé existe, pas nécessairement qu’il passe.

## Tests unitaires — règles métier

- [x] **Haute — Validation d’une demande** : refuser un nom absent ou trop long, un e-mail vide ou invalide, un téléphone de plus de 30 caractères et un message de plus de 2 000 caractères ; vérifier le retrait des espaces et l’acceptation des champs facultatifs vides.
- [x] **Haute — Normalisation de l’e-mail** : retirer les espaces périphériques et convertir l’adresse en minuscules.
- [x] **Moyenne — Limites acceptées** : accepter un nom de 100 caractères, un téléphone de 30 caractères et un message de 2 000 caractères.

## Tests d’intégration — données et actions

- [x] **Haute — Création d’une demande** : créer un contact et une demande au statut « Nouveau » ; accepter les champs facultatifs vides.
- [x] **Haute — Demandes répétées** : pour deux demandes avec le même e-mail, y compris avec des majuscules ou des espaces, conserver un seul contact et créer deux demandes.
- [x] **Haute — Suppression** : supprimer une demande parmi plusieurs sans supprimer le contact ni ses autres demandes ; conserver également le contact après la suppression de sa dernière demande.
- [x] **Haute — Modification** : changer le statut et vérifier que la note est nettoyée des espaces superflus et limitée à 2 000 caractères.
- [x] **Moyenne — Listes et erreurs** : ordonner les statuts comme prévu et les demandes de la plus récente à la plus ancienne ; gérer l’absence du statut « Nouveau » ou un identifiant de statut inexistant.
- [x] **Haute — Isolation de la base** : diriger toutes les opérations de test vers `data/test.sqlite`, jamais vers `data/local.sqlite`.

## Tests E2E — parcours et droits

- [x] **Haute — Visiteur non connecté** : rediriger l’ouverture de `/crm` vers `/connexion`.
- [x] **Haute — Ella, gestionnaire** : se connecter, voir les demandes, ajouter une demande reçue par téléphone, modifier un statut et une note, puis supprimer après confirmation.
- [x] **Haute — Yanis, accès limité dans l’interface** : autoriser l’ouverture du CRM sans afficher les demandes ni les commandes de gestion.
- [x] **Haute — Formulaire public valide** : après une saisie valide, afficher la page de remerciement et retrouver le message dans le CRM.
- [x] **Moyenne — Annulation de suppression** : annuler la boîte de dialogue et vérifier que la demande reste présente.
- [x] **Moyenne — Inscription désactivée** : vérifier qu’un visiteur ne peut pas créer de compte publiquement.

## Vérifications complémentaires

### Formulaire public

- [x] **Haute — Saisie invalide dans le navigateur** — Chromium accepte un domaine sans point à la saisie. Le serveur renvoie une erreur visible et la base ne reçoit ni contact ni demande.
- [x] **Moyenne — Champs facultatifs absents** — la base stocke `NULL` pour le téléphone et une chaîne vide pour le message.
- [x] **Moyenne — Domaines mal formés** — les tests vérifient le rejet des domaines sans point, avec des points consécutifs ou avec un point initial ou final.
- [ ] **Règle à confirmer** — la validation actuelle accepte encore `nom..prenom@example.test`. Décider si les points consécutifs avant `@` doivent être refusés.

### Connexion et droits

- [x] **Haute — Mauvais mot de passe** — Better Auth refuse la connexion, le formulaire affiche l’erreur et le CRM reste inaccessible.
- [x] **Haute — Déconnexion** — après avoir cliqué sur « Se déconnecter », une nouvelle ouverture de `/crm` renvoie vers `/connexion`.
- [x] **Haute — Actions directes de Yanis** — le test d’intégration ouvre une vraie session Better Auth, transmet son cookie via les en-têtes simulés de Next.js et appelle les trois actions serveur. Elles sont refusées et les demandes et contacts sont comparés avant et après.
- [x] **Moyenne — Aucune lecture pour Yanis** — la page CRM n’appelle ni `listerDemandes` ni `listerStatuts` pour son rôle limité.

### Actions du CRM et cas limites

- [x] **Moyenne — Statut mal formé** — l’action refuse un identifiant non numérique ou non entier avant l’écriture en base.
- [x] **Moyenne — Demande inconnue** — les tests confirment qu’une modification et une suppression avec un identifiant inconnu se terminent sans erreur et sans toucher aux lignes existantes. Le CRM conserve ses messages de confirmation actuels.

## Corrections appliquées

- La validation vérifie maintenant une structure d’e-mail minimale, avec une partie avant et un domaine après `@`.
- L’action publique lit le champ `message` envoyé par le formulaire.
- Le CRM ne charge et n’affiche les demandes que pour Ella ; Yanis voit un message indiquant que son accès est limité.
- La suppression retire uniquement la demande ; le contact est conservé.
- ESLint ignore le dossier `.next-e2e` généré par le serveur Playwright.
- La préparation des comptes E2E nettoie les adresses de test sans tenir compte de la casse.

## État d’exécution — 19 novembre 2026

- Vitest avec couverture — 54 tests réussis sur 54.
- Playwright sur Chromium — 9 parcours réussis sur 9, dont l’annulation de suppression dans le parcours de gestion.
- ESLint et TypeScript — vérifications réussies.
- Couverture Vitest — 94,73 % des instructions, 86,40 % des branches, 87,09 % des fonctions et 94,91 % des lignes. Chaque mesure dépasse le seuil de 80 %.

Les tests sont dans `tests/` et `e2e/`. Les tests d’intégration et E2E utilisent uniquement des données fictives et la base séparée `data/test.sqlite`.
