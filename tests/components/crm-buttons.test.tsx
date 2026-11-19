import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock('@/lib/auth-client', () => ({ authClient: { signOut: mocks.signOut } }));
vi.mock('@/app/crm/actions', () => ({ supprimerDemandeAction: vi.fn() }));

import { BoutonDeconnexion, BoutonSupprimer } from '@/app/crm/boutons';

describe('boutons du CRM', () => {
  beforeEach(() => vi.clearAllMocks());

  it('annule la suppression si la confirmation est refusée', () => {
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<BoutonSupprimer id="TEST-demande" />);
    const form = screen.getByRole('button', { name: 'Supprimer' }).closest('form');
    if (!form) throw new Error('Le formulaire de suppression doit être présent.');
    const event = new Event('submit', { bubbles: true, cancelable: true });

    form.dispatchEvent(event);

    expect(confirmation).toHaveBeenCalledWith('Supprimer cette demande ? Le contact et ses autres demandes sont conservés.');
    expect(event.defaultPrevented).toBe(true);
    confirmation.mockRestore();
  });

  it('redirige vers la connexion après la déconnexion', async () => {
    mocks.signOut.mockResolvedValue(undefined);
    render(<BoutonDeconnexion />);
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/connexion'));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
