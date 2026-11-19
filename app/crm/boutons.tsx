'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { supprimerDemandeAction } from './actions';

export function BoutonSupprimer({ id }: { id: string }) {
  return (
    <form
      action={supprimerDemandeAction}
      onSubmit={(event) => {
        if (!window.confirm('Supprimer cette demande ? Le contact et ses autres demandes sont conservés.')) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="discret">Supprimer</button>
    </form>
  );
}

export function BoutonDeconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="discret"
      onClick={async () => {
        await authClient.signOut();
        router.push('/connexion');
        router.refresh();
      }}
    >
      Se déconnecter
    </button>
  );
}
