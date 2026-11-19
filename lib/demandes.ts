import { asc, desc, eq } from 'drizzle-orm';
import { activerRelations, db } from './db';
import { contacts, demandes, statuts } from './db/schema';

export type DemandeSaisie = {
  nom: string;
  email: string;
  telephone?: string;
  message?: string;
};

export type Validation = { ok: true; demande: Required<DemandeSaisie> } | { ok: false; erreur: string };

// ---------- Règles : ce qu'on accepte, ce qu'on refuse ----------

export function normaliserEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validerDemande(saisie: DemandeSaisie): Validation {
  const nom = saisie.nom.trim();
  const email = normaliserEmail(saisie.email);
  const telephone = (saisie.telephone ?? '').trim();
  const message = (saisie.message ?? '').trim();

  if (!nom) return { ok: false, erreur: 'Indiquez votre nom.' };
  if (nom.length > 100) return { ok: false, erreur: 'Le nom est trop long.' };
  if (!email) return { ok: false, erreur: 'Indiquez votre adresse e-mail.' };
  if (!email.includes('@')) return { ok: false, erreur: 'Cette adresse e-mail n’est pas valide.' };
  if (telephone.length > 30) return { ok: false, erreur: 'Le numéro de téléphone est trop long.' };
  if (message.length > 2000) return { ok: false, erreur: 'Le message est trop long (2 000 caractères au plus).' };

  return { ok: true, demande: { nom, email, telephone, message } };
}

// ---------- Données ----------

export async function listerStatuts() {
  return db.select().from(statuts).orderBy(asc(statuts.ordre));
}

// Crée la demande, et le contact s'il n'existe pas encore (reconnu par son e-mail).
export async function creerDemande(saisie: DemandeSaisie) {
  const validation = validerDemande(saisie);
  if (!validation.ok) return validation;
  const { nom, email, telephone, message } = validation.demande;

  await activerRelations();
  const id = await db.transaction(async (tx) => {
    const [nouveau] = await tx.select().from(statuts).where(eq(statuts.libelle, 'Nouveau'));
    if (!nouveau) throw new Error('Statut « Nouveau » introuvable : lancez npm run setup.');

    let [contact] = await tx.select().from(contacts).where(eq(contacts.email, email));
    if (!contact) {
      [contact] = await tx
        .insert(contacts)
        .values({ id: crypto.randomUUID(), nom, email, telephone: telephone || null, creeLe: new Date() })
        .returning();
    }

    const demandeId = crypto.randomUUID();
    await tx.insert(demandes).values({
      id: demandeId,
      contactId: contact.id,
      statutId: nouveau.id,
      message,
      creeLe: new Date(),
    });
    return demandeId;
  });

  return { ok: true as const, id };
}

export async function listerDemandes() {
  return db
    .select({
      id: demandes.id,
      message: demandes.message,
      note: demandes.note,
      creeLe: demandes.creeLe,
      statutId: demandes.statutId,
      statut: statuts.libelle,
      contactId: contacts.id,
      nom: contacts.nom,
      email: contacts.email,
      telephone: contacts.telephone,
    })
    .from(demandes)
    .innerJoin(contacts, eq(demandes.contactId, contacts.id))
    .innerJoin(statuts, eq(demandes.statutId, statuts.id))
    .orderBy(desc(demandes.creeLe));
}

export async function modifierDemande(id: string, changement: { statutId: number; note: string }) {
  await activerRelations();
  await db
    .update(demandes)
    .set({ statutId: changement.statutId, note: changement.note.trim().slice(0, 2000) })
    .where(eq(demandes.id, id));
}

// Supprime une demande précise.
export async function supprimerDemande(id: string) {
  const [demande] = await db.select().from(demandes).where(eq(demandes.id, id));
  if (!demande) return;
  await db.delete(demandes).where(eq(demandes.id, id));
  await db.delete(contacts).where(eq(contacts.id, demande.contactId));
}
