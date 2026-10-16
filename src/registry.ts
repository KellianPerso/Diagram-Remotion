import {Entry} from './lib/entries';

// Découverte automatique : chaque fichier de src/diagrams/<projet>/ qui a un `export default`
// (tableau d'entrées) est ajouté au Studio et au rendu, rangé dans le dossier <projet>.
export interface Project {
  name: string;
  entries: Entry[];
}

const ctx = require.context('./diagrams', true, /\.tsx?$/);

const byProject = new Map<string, Entry[]>();
for (const key of ctx.keys().sort()) {
  const def = ctx(key).default;
  if (!Array.isArray(def)) continue;
  const name = key.replace(/^\.\//, '').split('/')[0].replace(/\.tsx?$/, '');
  byProject.set(name, [...(byProject.get(name) ?? []), ...(def as Entry[])]);
}

export const PROJECTS: Project[] = [...byProject].map(([name, entries]) => ({name, entries}));

const seen = new Set<string>();
for (const e of PROJECTS.flatMap((p) => p.entries)) {
  if (seen.has(e.id)) throw new Error(`identifiant de schéma en double : ${e.id}`);
  seen.add(e.id);
}
