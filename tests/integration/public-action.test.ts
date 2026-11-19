import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`); }),
  creerDemande: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/demandes', () => ({ creerDemande: mocks.creerDemande }));

import { envoyerDemande } from '@/app/actions';

function form(entries: Record<string, string>) {
  const donnees = new FormData();
  for (const [cle, valeur] of Object.entries(entries)) donnees.set(cle, valeur);
  return donnees;
}

describe('action du formulaire public', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transmet tous les champs, notamment le message saisi', async () => {
    mocks.creerDemande.mockResolvedValue({ ok: true, id: 'TEST-demande' });

    await expect(envoyerDemande(form({
      nom: 'TEST-Alex', email: 'alex@example.test', telephone: '06 00', message: 'Cours de guitare',
    }))).rejects.toThrow('REDIRECT:/merci');

    expect(mocks.creerDemande).toHaveBeenCalledWith({
      nom: 'TEST-Alex', email: 'alex@example.test', telephone: '06 00', message: 'Cours de guitare',
    });
  });

  it('redirige vers le formulaire avec le message de validation', async () => {
    mocks.creerDemande.mockResolvedValue({ ok: false, erreur: 'Indiquez votre nom.' });

    await expect(envoyerDemande(form({ nom: '', email: '' })))
      .rejects.toThrow('REDIRECT:/?erreur=Indiquez%20votre%20nom.#demande');
  });
});
