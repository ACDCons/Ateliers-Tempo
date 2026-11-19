import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`); }),
  revalidatePath: vi.fn(),
  exigerGestionnaire: vi.fn(),
  creerDemande: vi.fn(),
  modifierDemande: vi.fn(),
  supprimerDemande: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/acces', () => ({ exigerGestionnaire: mocks.exigerGestionnaire }));
vi.mock('@/lib/demandes', () => ({
  creerDemande: mocks.creerDemande,
  modifierDemande: mocks.modifierDemande,
  supprimerDemande: mocks.supprimerDemande,
}));

import { ajouterDemandeAction, modifierDemandeAction, supprimerDemandeAction } from '@/app/crm/actions';

function form(entries: Record<string, string>) {
  const donnees = new FormData();
  for (const [cle, valeur] of Object.entries(entries)) donnees.set(cle, valeur);
  return donnees;
}

describe('actions privées du CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exigerGestionnaire.mockResolvedValue({ id: 'ella', role: 'gestionnaire' });
    mocks.creerDemande.mockResolvedValue({ ok: true, id: 'TEST-demande' });
    mocks.modifierDemande.mockResolvedValue(undefined);
    mocks.supprimerDemande.mockResolvedValue(undefined);
  });

  it('bloque un visiteur limité avant toute action de données', async () => {
    mocks.exigerGestionnaire.mockRejectedValue(new Error('Accès refusé'));

    await expect(ajouterDemandeAction(form({ nom: 'TEST-Alex', email: 'alex@example.test' }))).rejects.toThrow('Accès refusé');
    await expect(modifierDemandeAction(form({ id: 'TEST-id', statutId: '2', note: '' }))).rejects.toThrow('Accès refusé');
    await expect(supprimerDemandeAction(form({ id: 'TEST-id' }))).rejects.toThrow('Accès refusé');
    expect(mocks.creerDemande).not.toHaveBeenCalled();
    expect(mocks.modifierDemande).not.toHaveBeenCalled();
    expect(mocks.supprimerDemande).not.toHaveBeenCalled();
  });

  it('ajoute une demande reçue par téléphone puis revalide le CRM', async () => {
    await expect(ajouterDemandeAction(form({
      nom: 'TEST-Alex', email: 'alex@example.test', telephone: '06 00', message: 'Cours de piano',
    }))).rejects.toThrow('REDIRECT:/crm?ok=ajout');

    expect(mocks.creerDemande).toHaveBeenCalledWith({
      nom: 'TEST-Alex', email: 'alex@example.test', telephone: '06 00', message: 'Cours de piano',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/crm');
  });

  it('redirige avec une erreur si l’ajout est invalide', async () => {
    mocks.creerDemande.mockResolvedValue({ ok: false, erreur: 'Indiquez votre nom.' });

    await expect(ajouterDemandeAction(form({ nom: '', email: '' })))
      .rejects.toThrow('REDIRECT:/crm?erreur=Indiquez%20votre%20nom.');
  });

  it('refuse une modification sans identifiant', async () => {
    await expect(modifierDemandeAction(form({ id: '', statutId: '2', note: '' })))
      .rejects.toThrow('REDIRECT:/crm?erreur=Modification%20incompl%C3%A8te');
    expect(mocks.modifierDemande).not.toHaveBeenCalled();
  });

  it.each(['invalide', '1.5'])('refuse un identifiant de statut mal formé (%s)', async (statutId) => {
    await expect(modifierDemandeAction(form({ id: 'TEST-id', statutId, note: '' })))
      .rejects.toThrow('REDIRECT:/crm?erreur=Modification%20incompl%C3%A8te');
    expect(mocks.modifierDemande).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('modifie une demande et revalide le CRM', async () => {
    await expect(modifierDemandeAction(form({ id: 'TEST-id', statutId: '3', note: '  rappeler  ' })))
      .rejects.toThrow('REDIRECT:/crm?ok=modification');
    expect(mocks.modifierDemande).toHaveBeenCalledWith('TEST-id', { statutId: 3, note: '  rappeler  ' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/crm');
  });

  it('supprime la demande demandée et tolère un identifiant vide', async () => {
    await expect(supprimerDemandeAction(form({ id: 'TEST-id' }))).rejects.toThrow('REDIRECT:/crm?ok=suppression');
    expect(mocks.supprimerDemande).toHaveBeenCalledWith('TEST-id');

    mocks.supprimerDemande.mockClear();
    await expect(supprimerDemandeAction(form({ id: '' }))).rejects.toThrow('REDIRECT:/crm?ok=suppression');
    expect(mocks.supprimerDemande).not.toHaveBeenCalled();
  });
});
