import { randomBytes, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { ajouterDemandeAction, modifierDemandeAction, supprimerDemandeAction } from '@/app/crm/actions';
import { lireVisiteur } from '@/lib/acces';
import { auth } from '@/lib/auth';
import { activerRelations, db } from '@/lib/db';
import { contacts, demandes, statuts, user } from '@/lib/db/schema';
import { creerDemande, listerDemandes, listerStatuts, modifierDemande, supprimerDemande } from '@/lib/demandes';
import { resetDemandesData } from '../helpers/demandes-db';

const requete = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock('next/headers', () => ({ headers: requete.headers }));

describe('demandes — intégration SQLite', () => {
  beforeEach(async () => {
    await resetDemandesData();
  });

  it('crée un contact et une demande au statut Nouveau', async () => {
    const resultat = await creerDemande({
      nom: ' TEST-Alex Exemple ',
      email: ' Alex@Example.Test ',
      telephone: ' 06 00 ',
      message: ' Cours de piano ',
    });

    expect(resultat.ok).toBe(true);
    const [contact] = await db.select().from(contacts);
    const [demande] = await db.select().from(demandes);
    expect(contact).toMatchObject({ nom: 'TEST-Alex Exemple', email: 'alex@example.test', telephone: '06 00' });
    expect(demande).toMatchObject({ contactId: contact.id, statutId: 1, message: 'Cours de piano' });
  });

  it('réutilise le contact lorsque le même e-mail est soumis sous une autre casse', async () => {
    await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test', message: 'Piano' });
    await creerDemande({ nom: 'TEST-Alex bis', email: '  ALEX@EXAMPLE.TEST ', message: 'Chant' });

    expect(await db.select().from(contacts)).toHaveLength(1);
    expect(await db.select().from(demandes)).toHaveLength(2);
    expect((await listerDemandes()).map((ligne) => ligne.message).sort()).toEqual(['Chant', 'Piano']);
  });

  it('enregistre sans téléphone ni message quand les champs sont absents', async () => {
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' });
    if (!resultat.ok) throw new Error('La demande de fixture doit être créée.');

    const [contact] = await db.select().from(contacts).where(eq(contacts.email, 'alex@example.test'));
    const [demande] = await db.select().from(demandes).where(eq(demandes.id, resultat.id));
    expect(contact.telephone).toBeNull();
    expect(demande).toMatchObject({ contactId: contact.id, message: '' });
  });

  it('liste les statuts dans leur ordre métier', async () => {
    expect((await listerStatuts()).map((statut) => statut.libelle)).toEqual([
      'Nouveau', 'En discussion', 'Inscrit', 'Perdu',
    ]);
  });

  it('liste les demandes de la plus récente à la plus ancienne', async () => {
    const maintenant = Date.now();
    const contactId = 'TEST-contact-tri';
    await db.insert(contacts).values({
      id: contactId, nom: 'TEST-Tri', email: 'tri@example.test', telephone: null, creeLe: new Date(maintenant),
    });
    await db.insert(demandes).values([
      { id: 'TEST-demande-ancienne', contactId, statutId: 1, message: 'ancienne', creeLe: new Date(maintenant - 1000) },
      { id: 'TEST-demande-recente', contactId, statutId: 1, message: 'récente', creeLe: new Date(maintenant) },
    ]);

    expect((await listerDemandes()).map((ligne) => ligne.message)).toEqual(['récente', 'ancienne']);
  });

  it('modifie le statut et nettoie puis limite la note à 2 000 caractères', async () => {
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' });
    if (!resultat.ok) throw new Error('La demande de fixture doit être créée.');

    await modifierDemande(resultat.id, { statutId: 2, note: '  Rappeler mardi  ' });
    let [ligne] = await db.select().from(demandes).where(eq(demandes.id, resultat.id));
    expect(ligne).toMatchObject({ statutId: 2, note: 'Rappeler mardi' });

    await modifierDemande(resultat.id, { statutId: 2, note: 'n'.repeat(2001) });
    [ligne] = await db.select().from(demandes).where(eq(demandes.id, resultat.id));
    expect(ligne.note).toHaveLength(2000);
  });

  it('signale l’absence du statut Nouveau', async () => {
    await db.delete(statuts);
    await expect(creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' }))
      .rejects.toThrow('Statut « Nouveau » introuvable');
  });

  it('refuse un identifiant de statut inexistant', async () => {
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' });
    if (!resultat.ok) throw new Error('La demande de fixture doit être créée.');

    await expect(modifierDemande(resultat.id, { statutId: 999, note: '' })).rejects.toThrow();
  });

  it('conserve le contact et les autres demandes après une suppression', async () => {
    await activerRelations();
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test', message: 'Piano' });
    if (!resultat.ok) throw new Error('La première demande de fixture doit être créée.');
    await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test', message: 'Chant' });
    const lignes = await db.select().from(demandes);

    await expect(supprimerDemande(resultat.id)).resolves.toBeUndefined();

    expect(await db.select().from(contacts)).toHaveLength(1);
    expect(await db.select().from(demandes)).toHaveLength(1);
    expect((await listerDemandes())[0]?.message).toBe(lignes.find((ligne) => ligne.id !== resultat.id)?.message);
  });

  it('conserve le contact après la suppression de sa dernière demande', async () => {
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' });
    if (!resultat.ok) throw new Error('La demande de fixture doit être créée.');

    await supprimerDemande(resultat.id);

    expect(await db.select().from(demandes)).toHaveLength(0);
    expect(await db.select().from(contacts)).toHaveLength(1);
  });

  it.each([
    ['modifier', () => modifierDemande('TEST-absente', { statutId: 2, note: 'TEST-note' })],
    ['supprimer', () => supprimerDemande('TEST-absente')],
  ] as const)('ne change aucune ligne quand on cherche à %s une demande inconnue', async (_operation, agir) => {
    const resultat = await creerDemande({ nom: 'TEST-Alex', email: 'alex@example.test' });
    expect(resultat.ok).toBe(true);
    const avant = await listerDemandes();
    expect(avant).toHaveLength(1);

    await expect(agir()).resolves.toBeUndefined();

    expect(await listerDemandes()).toEqual(avant);
  });

  it('refuse les trois actions privées avec une session Better Auth de Yanis', async () => {
    const resultat = await creerDemande({ nom: 'TEST-Demande protégée', email: 'test-protegee@example.test' });
    if (!resultat.ok) throw new Error('La demande de fixture doit être créée.');
    const contexte = await auth.$context;
    const email = `test-yanis-${randomUUID()}@example.test`;
    const password = randomBytes(24).toString('base64url');
    const yanis = await contexte.internalAdapter.createUser(
      { name: 'TEST-Yanis', email, emailVerified: true },
      { method: 'email-password' },
    );

    try {
      await contexte.internalAdapter.linkAccount({
        accountId: yanis.id,
        userId: yanis.id,
        providerId: 'credential',
        password: await contexte.password.hash(password),
      });
      const connexion = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
      expect(connexion.status).toBe(200);
      const cookies = connexion.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0]).join('; ');
      requete.headers.mockResolvedValue(new Headers({ cookie: cookies }));
      expect(await lireVisiteur()).toMatchObject({ id: yanis.id, role: 'temoin' });

      const ajout = new FormData();
      ajout.set('nom', 'TEST-Ajout refusé');
      ajout.set('email', 'test-ajout-refuse@example.test');
      const modification = new FormData();
      modification.set('id', resultat.id);
      modification.set('statutId', '2');
      modification.set('note', 'TEST-Modification refusée');
      const suppression = new FormData();
      suppression.set('id', resultat.id);

      const demandesAvant = await db.select().from(demandes);
      const contactsAvant = await db.select().from(contacts);
      await expect(ajouterDemandeAction(ajout)).rejects.toThrow('Accès refusé');
      await expect(modifierDemandeAction(modification)).rejects.toThrow('Accès refusé');
      await expect(supprimerDemandeAction(suppression)).rejects.toThrow('Accès refusé');
      expect(await db.select().from(demandes)).toEqual(demandesAvant);
      expect(await db.select().from(contacts)).toEqual(contactsAvant);
    } finally {
      requete.headers.mockReset();
      await db.delete(user).where(eq(user.id, yanis.id));
    }
  });
});
