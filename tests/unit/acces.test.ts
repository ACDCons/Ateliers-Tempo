import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mocks.getSession } } }));

import { lireVisiteur, exigerGestionnaire } from '@/lib/acces';

describe('contrôle des rôles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('renvoie null sans session et relit les en-têtes à chaque appel', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(lireVisiteur()).resolves.toBeNull();
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it('identifie la gestionnaire', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'ella', email: 'ella@example.test', name: 'Ella', role: 'gestionnaire' } });

    await expect(lireVisiteur()).resolves.toEqual({
      id: 'ella', email: 'ella@example.test', nom: 'Ella', role: 'gestionnaire',
    });
    await expect(exigerGestionnaire()).resolves.toMatchObject({ id: 'ella', role: 'gestionnaire' });
  });

  it('traite tout rôle autre que gestionnaire comme accès limité', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'yanis', email: 'yanis@example.test', name: 'Yanis', role: 'autre' } });

    await expect(lireVisiteur()).resolves.toMatchObject({ id: 'yanis', role: 'temoin' });
    await expect(exigerGestionnaire()).rejects.toThrow('Accès refusé');
  });

  it('refuse le visiteur non connecté pour une action gestionnaire', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(exigerGestionnaire()).rejects.toThrow('Accès refusé');
  });
});
