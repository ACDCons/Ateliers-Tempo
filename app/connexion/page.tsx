'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function Connexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur('');
    setEnCours(true);
    const donnees = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(donnees.get('email') ?? ''),
      password: String(donnees.get('motDePasse') ?? ''),
    });
    setEnCours(false);
    if (error) {
      setErreur('E-mail ou mot de passe incorrect.');
      return;
    }
    router.push('/crm');
    router.refresh();
  }

  return (
    <section className="formulaire">
      <h1>Connexion</h1>
      <p>Espace réservé. Les comptes sont créés par l’école, il n’y a pas d’inscription.</p>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <form onSubmit={seConnecter}>
        <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
        <label>Mot de passe<input name="motDePasse" type="password" autoComplete="current-password" required /></label>
        <button type="submit" disabled={enCours}>{enCours ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </section>
  );
}
