import { redirect } from 'next/navigation';
import { lireVisiteur } from '@/lib/acces';
import { listerDemandes, listerStatuts } from '@/lib/demandes';
import { ajouterDemandeAction, modifierDemandeAction } from './actions';
import { BoutonDeconnexion, BoutonSupprimer } from './boutons';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  ajout: 'Demande ajoutée.',
  modification: 'Demande enregistrée.',
  suppression: 'Demande supprimée.',
};

export default async function Crm({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const visiteur = await lireVisiteur();
  if (!visiteur) redirect('/connexion');

  const { ok, erreur } = await searchParams;
  const gestionnaire = visiteur.role === 'gestionnaire';
  const [lignes, statuts] = await Promise.all([listerDemandes(), listerStatuts()]);

  return (
    <section className="crm">
      <div className="crm-entete">
        <div>
          <h1>Demandes de cours d’essai</h1>
          <p>Connecté : {visiteur.nom} · {gestionnaire ? 'gestionnaire' : 'accès limité'}</p>
        </div>
        <BoutonDeconnexion />
      </div>

      {ok && MESSAGES[ok] && <p className="succes" role="status">{MESSAGES[ok]}</p>}
      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      {lignes.length === 0 ? (
        <p>Aucune demande pour l’instant.</p>
      ) : (
        <ul className="demandes">
          {lignes.map((ligne) => (
            <li key={ligne.id} className="demande" data-testid="demande">
              <div className="demande-tete">
                <strong>{ligne.nom}</strong>
                <span>{ligne.email}{ligne.telephone ? ` · ${ligne.telephone}` : ''}</span>
                <span className="statut">{ligne.statut}</span>
                <time>{ligne.creeLe.toLocaleDateString('fr-FR')}</time>
              </div>
              <p className="demande-message">{ligne.message || <em>Pas de message.</em>}</p>
              {gestionnaire && (
                <div className="demande-actions">
                  <form action={modifierDemandeAction} className="ligne">
                    <input type="hidden" name="id" value={ligne.id} />
                    <label>Statut
                      <select name="statutId" defaultValue={ligne.statutId}>
                        {statuts.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                      </select>
                    </label>
                    <label>Note<input name="note" defaultValue={ligne.note} /></label>
                    <button type="submit">Enregistrer</button>
                  </form>
                  <BoutonSupprimer id={ligne.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {gestionnaire && (
        <details className="formulaire">
          <summary>Ajouter une demande reçue par téléphone</summary>
          <form action={ajouterDemandeAction}>
            <label>Nom<input name="nom" required /></label>
            <label>E-mail<input name="email" type="email" required /></label>
            <label>Téléphone<input name="telephone" type="tel" /></label>
            <label>Message<textarea name="message" rows={3} /></label>
            <button type="submit">Ajouter</button>
          </form>
        </details>
      )}
    </section>
  );
}
