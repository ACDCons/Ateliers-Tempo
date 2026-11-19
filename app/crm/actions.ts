'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigerGestionnaire } from '@/lib/acces';
import { creerDemande, modifierDemande, supprimerDemande } from '@/lib/demandes';

// Chaque action privée vérifie, côté serveur, que c'est bien la gestionnaire.

export async function ajouterDemandeAction(formData: FormData) {
  await exigerGestionnaire();
  const resultat = await creerDemande({
    nom: String(formData.get('nom') ?? ''),
    email: String(formData.get('email') ?? ''),
    telephone: String(formData.get('telephone') ?? ''),
    message: String(formData.get('message') ?? ''),
  });
  if (!resultat.ok) redirect(`/crm?erreur=${encodeURIComponent(resultat.erreur)}`);
  revalidatePath('/crm');
  redirect('/crm?ok=ajout');
}

export async function modifierDemandeAction(formData: FormData) {
  await exigerGestionnaire();
  const id = String(formData.get('id') ?? '');
  const statutId = Number(formData.get('statutId'));
  if (!id || !Number.isInteger(statutId)) redirect('/crm?erreur=Modification%20incompl%C3%A8te');
  await modifierDemande(id, { statutId, note: String(formData.get('note') ?? '') });
  revalidatePath('/crm');
  redirect('/crm?ok=modification');
}

export async function supprimerDemandeAction(formData: FormData) {
  await exigerGestionnaire();
  const id = String(formData.get('id') ?? '');
  if (id) await supprimerDemande(id);
  revalidatePath('/crm');
  redirect('/crm?ok=suppression');
}
