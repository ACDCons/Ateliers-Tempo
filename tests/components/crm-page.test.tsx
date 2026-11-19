import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`); }),
  lireVisiteur: vi.fn(),
  listerDemandes: vi.fn(),
  listerStatuts: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/acces', () => ({ lireVisiteur: mocks.lireVisiteur }));
vi.mock('@/lib/demandes', () => ({
  listerDemandes: mocks.listerDemandes,
  listerStatuts: mocks.listerStatuts,
}));
vi.mock('@/app/crm/actions', () => ({
  ajouterDemandeAction: vi.fn(),
  modifierDemandeAction: vi.fn(),
}));
vi.mock('@/app/crm/boutons', () => ({
  BoutonDeconnexion: () => null,
  BoutonSupprimer: () => null,
}));

import Crm from '@/app/crm/page';

const ligne = {
  id: 'TEST-demande', message: 'TEST-message', note: '', creeLe: new Date('2026-01-01T00:00:00Z'),
  statutId: 1, statut: 'Nouveau', contactId: 'TEST-contact', nom: 'TEST-Alex',
  email: 'alex@example.test', telephone: null,
};
const statuts = [
  { id: 1, libelle: 'Nouveau', ordre: 1 },
  { id: 2, libelle: 'En discussion', ordre: 2 },
];

describe('page CRM', () => {
  it('redirige le visiteur non connecté', async () => {
    mocks.lireVisiteur.mockResolvedValue(null);

    await expect(Crm({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/connexion');
  });

  it('affiche les demandes et les actions à la gestionnaire', async () => {
    mocks.lireVisiteur.mockResolvedValue({ id: 'ella', email: 'ella@example.test', nom: 'Ella', role: 'gestionnaire' });
    mocks.listerDemandes.mockResolvedValue([ligne]);
    mocks.listerStatuts.mockResolvedValue(statuts);

    render(await Crm({ searchParams: Promise.resolve({ ok: 'ajout' }) }));

    expect(screen.getByText('TEST-Alex')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Demande ajoutée.');
    expect(screen.getByText('Ajouter une demande reçue par téléphone')).toBeTruthy();
  });

  it('ne révèle aucune demande à Yanis', async () => {
    mocks.lireVisiteur.mockResolvedValue({ id: 'yanis', email: 'yanis@example.test', nom: 'Yanis', role: 'temoin' });
    mocks.listerDemandes.mockResolvedValue([ligne]);
    mocks.listerStatuts.mockResolvedValue(statuts);

    render(await Crm({ searchParams: Promise.resolve({ erreur: 'Action refusée.' }) }));

    expect(screen.queryByText('TEST-Alex')).toBeNull();
    expect(screen.queryByText('TEST-message')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Action refusée.');
    expect(mocks.listerDemandes).not.toHaveBeenCalled();
    expect(mocks.listerStatuts).not.toHaveBeenCalled();
  });

  it('affiche l’état vide sans demande', async () => {
    mocks.lireVisiteur.mockResolvedValue({ id: 'ella', email: 'ella@example.test', nom: 'Ella', role: 'gestionnaire' });
    mocks.listerDemandes.mockResolvedValue([]);
    mocks.listerStatuts.mockResolvedValue(statuts);

    render(await Crm({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('Aucune demande pour l’instant.')).toBeTruthy();
  });
});
