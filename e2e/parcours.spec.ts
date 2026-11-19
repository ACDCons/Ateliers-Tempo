import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import { expect, test, type Page } from '@playwright/test';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { contacts, demandes } from '../lib/db/schema';

async function envoyerDemandePublique(page: Page, nom: string, email: string, message: string) {
  await page.goto('/#demande');
  await page.getByLabel('Nom').fill(nom);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Votre message (facultatif)').fill(message);
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  await expect(page.getByRole('heading', { name: 'Merci pour votre demande.' })).toBeVisible();
}

async function soumettreConnexion(page: Page, email: string | undefined, motDePasse: string | undefined) {
  expect(email, 'Le compte E2E doit être préparé dans la base de test.').toBeTruthy();
  expect(motDePasse, 'Le mot de passe E2E temporaire doit être disponible en mémoire.').toBeTruthy();
  await page.goto('/connexion');
  await page.waitForLoadState('networkidle');
  await page.locator('form').evaluate((form) => {
    form.addEventListener('submit', (event) => event.preventDefault(), { capture: true });
  });
  await page.getByLabel('E-mail').fill(email!);
  await page.getByLabel('Mot de passe').fill(motDePasse!);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

async function seConnecter(page: Page, email: string | undefined, motDePasse: string | undefined) {
  await soumettreConnexion(page, email, motDePasse);
  await expect(page).toHaveURL(/\/crm(?:\?|$)/);
}

test('un visiteur non connecté est redirigé vers la connexion', async ({ page }) => {
  await page.goto('/crm');
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});

test('Better Auth refuse un mauvais mot de passe et le CRM reste inaccessible', async ({ page }) => {
  await soumettreConnexion(page, process.env.E2E_ELLA_EMAIL, randomBytes(24).toString('base64url'));
  await expect(page.getByRole('alert').filter({ hasText: /^E-mail ou mot de passe incorrect\.$/ })).toBeVisible();
  await expect(page).toHaveURL(/\/connexion$/);

  await page.goto('/crm');
  await expect(page).toHaveURL(/\/connexion$/);
});

test('après la déconnexion, Ella est redirigée quand elle rouvre le CRM', async ({ page }) => {
  await seConnecter(page, process.env.E2E_ELLA_EMAIL, process.env.E2E_ELLA_PASSWORD);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL(/\/connexion$/);

  await page.goto('/crm');
  await expect(page).toHaveURL(/\/connexion$/);
});

test('un e-mail sans domaine complet déclenche une erreur sans créer de contact ni de demande', async ({ page }) => {
  const client = createClient({ url: 'file:data/test.sqlite' });
  const db = drizzle(client);

  try {
    const contactsAvant = await db.select({ total: count() }).from(contacts);
    const demandesAvant = await db.select({ total: count() }).from(demandes);
    const identifiant = randomUUID();
    await page.goto('/#demande');
    await page.getByLabel('Nom').fill(`TEST-Invalide ${identifiant}`);
    const email = page.getByLabel('E-mail');
    await email.fill(`test-${identifiant}@local`);
    expect(await email.evaluate((champ: HTMLInputElement) => champ.validity.valid)).toBe(true);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

    await expect(page.getByRole('alert').filter({ hasText: /^Cette adresse e-mail n’est pas valide\.$/ })).toBeVisible();
    expect(await db.select({ total: count() }).from(contacts)).toEqual(contactsAvant);
    expect(await db.select({ total: count() }).from(demandes)).toEqual(demandesAvant);
  } finally {
    client.close();
  }
});

test('le formulaire public confirme une demande valide', async ({ page }) => {
  const identifiant = randomUUID();
  await envoyerDemandePublique(
    page,
    `TEST-Visiteur ${identifiant}`,
    `test-${identifiant}@example.test`,
    `TEST-message ${identifiant}`,
  );
});

test('Ella retrouve dans le CRM le message envoyé par le formulaire public', async ({ page }) => {
  const identifiant = randomUUID();
  const email = `test-message-${identifiant}@example.test`;
  const message = `TEST-message-persisté ${identifiant}`;
  await envoyerDemandePublique(page, `TEST-Message ${identifiant}`, email, message);
  await seConnecter(page, process.env.E2E_ELLA_EMAIL, process.env.E2E_ELLA_PASSWORD);

  await expect(page.locator('[data-testid="demande"]').filter({ hasText: email })).toContainText(message);
});

test('Ella peut gérer les demandes et la suppression conserve le contact restant', async ({ page }) => {
  const identifiant = randomUUID();
  const email = `test-${identifiant}@example.test`;
  await envoyerDemandePublique(page, `TEST-Ella ${identifiant}`, email, 'TEST-piano');
  await envoyerDemandePublique(page, `TEST-Ella ${identifiant}`, email, 'TEST-chant');

  await seConnecter(page, process.env.E2E_ELLA_EMAIL, process.env.E2E_ELLA_PASSWORD);
  const emailTelephone = `test-telephone-${identifiant}@example.test`;
  const formulaireTelephone = page.locator('details.formulaire');
  await formulaireTelephone.locator('summary').click();
  await formulaireTelephone.getByLabel('Nom').fill(`TEST-Téléphone ${identifiant}`);
  await formulaireTelephone.getByLabel('E-mail').fill(emailTelephone);
  await formulaireTelephone.getByLabel('Message').fill('TEST-demande reçue par téléphone');
  await formulaireTelephone.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('[data-testid="demande"]').filter({ hasText: emailTelephone })).toHaveCount(1);

  const cartes = page.locator('[data-testid="demande"]').filter({ hasText: email });
  await expect(cartes).toHaveCount(2);

  const premiere = cartes.first();
  await premiere.locator('select[name="statutId"]').selectOption('2');
  await premiere.getByLabel('Note').fill('TEST-rappeler mardi');
  await premiere.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(premiere.locator('.statut')).toHaveText('En discussion');
  await expect(premiere.getByLabel('Note')).toHaveValue('TEST-rappeler mardi');

  const confirmation = page.waitForEvent('dialog');
  const clicSuppression = premiere.getByRole('button', { name: 'Supprimer' }).click();
  await (await confirmation).dismiss();
  await clicSuppression;
  await expect(cartes).toHaveCount(2);

  page.once('dialog', (dialog) => dialog.accept());
  await premiere.getByRole('button', { name: 'Supprimer' }).click();
  await expect(cartes).toHaveCount(1);
  await expect(cartes.first()).toContainText(email);
});

test('Yanis ouvre le CRM sans voir ni pouvoir modifier les demandes', async ({ page }) => {
  const identifiant = randomUUID();
  const emailDemande = `test-${identifiant}@example.test`;
  await envoyerDemandePublique(page, `TEST-Yanis ${identifiant}`, emailDemande, 'TEST-confidentiel');

  await seConnecter(page, process.env.E2E_YANIS_EMAIL, process.env.E2E_YANIS_PASSWORD);
  await expect(page.getByRole('heading', { name: 'Demandes de cours d’essai' })).toBeVisible();
  await expect(page.locator('[data-testid="demande"]').filter({ hasText: emailDemande })).toHaveCount(0);
  await expect(page.getByText('Ajouter une demande reçue par téléphone')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Supprimer' })).toHaveCount(0);
});

test('l’inscription publique est refusée', async ({ request }) => {
  const response = await request.post('/api/auth/sign-up/email', {
    data: {
      name: `TEST-Inscription ${randomUUID()}`,
      email: `test-${randomUUID()}@example.test`,
      password: randomBytes(24).toString('base64url'),
    },
  });

  expect(response.ok()).toBe(false);
});
