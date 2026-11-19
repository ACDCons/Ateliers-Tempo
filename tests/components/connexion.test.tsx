import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInEmail: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: { email: mocks.signInEmail } } }));

import Connexion from '@/app/connexion/page';

describe('connexion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche un message clair si les identifiants sont refusés', async () => {
    mocks.signInEmail.mockResolvedValue({ error: { message: 'invalid credentials' } });
    render(<Connexion />);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.test' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: randomBytes(24).toString('base64url') } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('E-mail ou mot de passe incorrect.'));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('ouvre le CRM après une connexion réussie', async () => {
    mocks.signInEmail.mockResolvedValue({ error: null });
    render(<Connexion />);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ella@example.test' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: randomBytes(24).toString('base64url') } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/crm'));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
