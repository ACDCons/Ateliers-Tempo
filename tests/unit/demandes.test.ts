import { describe, expect, it } from 'vitest';
import { normaliserEmail, validerDemande } from '@/lib/demandes';

const demandeValide = {
  nom: 'TEST-Alex Exemple',
  email: 'alex@example.test',
};

describe('normaliserEmail', () => {
  it('retire les espaces et met l’adresse en minuscules', () => {
    expect(normaliserEmail('  Alex.Exemple@Example.Test  ')).toBe('alex.exemple@example.test');
  });
});

describe('validerDemande', () => {
  it('nettoie les champs et accepte les champs facultatifs vides', () => {
    expect(validerDemande({ nom: ' TEST-Alex ', email: ' ALEX@example.test ' })).toEqual({
      ok: true,
      demande: { nom: 'TEST-Alex', email: 'alex@example.test', telephone: '', message: '' },
    });
  });

  it.each([
    [{ ...demandeValide, nom: '   ' }, 'Indiquez votre nom.'],
    [{ ...demandeValide, nom: 'N'.repeat(101) }, 'Le nom est trop long.'],
    [{ ...demandeValide, email: '   ' }, 'Indiquez votre adresse e-mail.'],
    [{ ...demandeValide, email: 'pas-une-adresse' }, 'Cette adresse e-mail n’est pas valide.'],
    [{ ...demandeValide, telephone: '1'.repeat(31) }, 'Le numéro de téléphone est trop long.'],
    [{ ...demandeValide, message: 'm'.repeat(2001) }, 'Le message est trop long (2 000 caractères au plus).'],
  ])('refuse les saisies invalides avec un message explicite', (saisie, erreur) => {
    expect(validerDemande(saisie)).toEqual({ ok: false, erreur });
  });

  it.each([
    'personne@', '@example.test', 'personne@@example.test', 'personne@example..test',
    'personne@.example.test', 'personne@example.test.', 'personne@local',
  ])('refuse le format d’e-mail invalide %s', (email) => {
    expect(validerDemande({ ...demandeValide, email })).toMatchObject({ ok: false });
  });

  it('accepte les limites maximales prévues', () => {
    expect(validerDemande({
      nom: 'N'.repeat(100),
      email: 'alex@example.test',
      telephone: '1'.repeat(30),
      message: 'm'.repeat(2000),
    })).toMatchObject({ ok: true });
  });
});
