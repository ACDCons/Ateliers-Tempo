import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '@/app/layout';

describe('mise en page générale', () => {
  it('affiche les liens principaux et la page enfant', () => {
    const html = renderToStaticMarkup(RootLayout({ children: <p>TEST-contenu</p> }));

    expect(html).toContain('lang="fr"');
    expect(html).toContain('Les Ateliers Tempo');
    expect(html).toContain('href="/#demande"');
    expect(html).toContain('TEST-contenu');
  });
});
