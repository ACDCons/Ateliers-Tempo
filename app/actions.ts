'use server';

import { redirect } from 'next/navigation';
import { creerDemande } from '@/lib/demandes';

// Formulaire public de la landing : seuls ces champs sont acceptés.
export async function envoyerDemande(formData: FormData) {
  const resultat = await creerDemande({
    nom: String(formData.get('nom') ?? ''),
    email: String(formData.get('email') ?? ''),
    telephone: String(formData.get('telephone') ?? ''),
    message: String(formData.get('message') ?? ''),
  });

  if (!resultat.ok) redirect(`/?erreur=${encodeURIComponent(resultat.erreur)}#demande`);
  redirect('/merci');
}
