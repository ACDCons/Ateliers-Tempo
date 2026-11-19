import { activerRelations, db } from '@/lib/db';
import { contacts, demandes, statuts } from '@/lib/db/schema';

export async function resetDemandesData() {
  await activerRelations();
  await db.delete(demandes);
  await db.delete(contacts);
  await db.delete(statuts);
  await db.insert(statuts).values([
    { id: 1, libelle: 'Nouveau', ordre: 1 },
    { id: 2, libelle: 'En discussion', ordre: 2 },
    { id: 3, libelle: 'Inscrit', ordre: 3 },
    { id: 4, libelle: 'Perdu', ordre: 4 },
  ]);
}
