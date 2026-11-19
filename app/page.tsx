import { envoyerDemande } from './actions';
import Image from 'next/image';

export default async function Accueil({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;

  return (
    <>
      <section className="hero">
        <div className="hero-contenu">
          <p className="surtitre">École de musique · tous niveaux</p>
          <h1>La musique, avec Ella.</h1>
          <p>Piano, guitare et chant, en petits groupes ou en cours particuliers. Le premier cours sert à se rencontrer : on écoute vos envies, on choisit ensemble.</p>
          <a className="bouton" href="#demande">Demander un cours d’essai</a>
        </div>
        <Image
          className="hero-illustration"
          src="/piano-illustration.png"
          alt="Piano droit prune accompagné d’une plante et de fleurs violettes."
          width={1312}
          height={1199}
          sizes="(max-width: 700px) 90vw, (max-width: 1100px) 40vw, 440px"
        />
      </section>

      <section className="cartes">
        <article><h2>Piano</h2><p>Lecture, oreille et premiers morceaux, à votre rythme.</p></article>
        <article><h2>Guitare</h2><p>Accords, rythmiques et accompagnement, acoustique ou électrique.</p></article>
        <article><h2>Chant</h2><p>Respiration, justesse et répertoire, seul ou en groupe.</p></article>
      </section>

      <section id="demande" className="formulaire">
        <h2>Demander un cours d’essai</h2>
        <p>Ella vous répond pour fixer un créneau. Aucune réservation n’est faite automatiquement.</p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <form action={envoyerDemande}>
          <label>Nom<input name="nom" autoComplete="name" required /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
          <label>Téléphone (facultatif)<input name="telephone" type="tel" autoComplete="tel" /></label>
          <label>Votre message (facultatif)<textarea name="message" rows={4} placeholder="Votre niveau, l’instrument qui vous tente, vos disponibilités…" /></label>
          <button type="submit">Envoyer ma demande</button>
        </form>
      </section>
    </>
  );
}
