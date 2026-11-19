import { headers } from 'next/headers';
import { auth } from './auth';

export type Visiteur = { id: string; email: string; nom: string; role: 'gestionnaire' | 'temoin' };

// Qui fait la requête ? null si personne n'est connecté. Relu côté serveur à chaque requête.
export async function lireVisiteur(): Promise<Visiteur | null> {
  const sessionActive = await auth.api.getSession({ headers: await headers() });
  if (!sessionActive) return null;
  const { id, email, name } = sessionActive.user;
  const role = (sessionActive.user as { role?: string }).role === 'gestionnaire' ? 'gestionnaire' : 'temoin';
  return { id, email, nom: name, role };
}

// Seule la gestionnaire lit, ajoute, modifie et supprime les demandes.
export async function exigerGestionnaire(): Promise<Visiteur> {
  const visiteur = await lireVisiteur();
  if (!visiteur || visiteur.role !== 'gestionnaire') throw new Error('Accès refusé');
  return visiteur;
}
