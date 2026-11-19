import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Les Ateliers Tempo · cours de musique avec Ella',
  description: 'Cours de piano, guitare et chant. Demandez un cours d’essai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="entete">
          <Link href="/" className="marque">Les Ateliers Tempo</Link>
          <nav>
            <Link href="/#demande">Cours d’essai</Link>
            <Link href="/crm">Espace Ella</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="pied">Site de démonstration · données fictives · Bootcamp Builder AI</footer>
      </body>
    </html>
  );
}
