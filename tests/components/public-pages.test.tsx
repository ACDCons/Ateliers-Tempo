import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/actions', () => ({ envoyerDemande: vi.fn() }));

import Accueil from '@/app/page';
import Merci from '@/app/merci/page';

describe('pages publiques', () => {
  it('affiche le formulaire et son erreur de validation', async () => {
    render(await Accueil({ searchParams: Promise.resolve({ erreur: 'Indiquez votre nom.' }) }));

    expect(screen.getByRole('heading', { name: 'La musique, avec Ella.' })).toBeTruthy();
    expect(screen.getByLabelText('Nom')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Indiquez votre nom.');
  });

  it('confirme la demande envoyée', () => {
    render(<Merci />);

    expect(screen.getByRole('heading', { name: 'Merci pour votre demande.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' }).getAttribute('href')).toBe('/');
  });
});
