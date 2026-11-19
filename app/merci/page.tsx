import Link from 'next/link';

export default function Merci() {
  return (
    <section className="formulaire">
      <h1>Merci pour votre demande.</h1>
      <p>Ella vous recontacte pour fixer votre cours d’essai.</p>
      <Link className="bouton" href="/">Retour à l’accueil</Link>
    </section>
  );
}
