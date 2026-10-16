# remotion-diagrams : guide pour l'assistant

Outil de **schémas d'architecture décrits en TypeScript** (AWS, C4, diagrammes de séquence),
rendus en PNG (image fixe) et MP4 (animation étape par étape) avec Remotion.
La documentation utilisateur est dans `README.md` : référence complète des propriétés
(`DiagramSpec`, `SeqSpec`, icônes, couleurs). La lire avant de créer ou modifier un schéma.

Langue du projet : **français** (code commenté, libellés, README, messages d'erreur).

## Commandes

```bash
npm ci                                    # installe + génère public/aws et public/fonts
npm run typecheck                         # tsc, à lancer après chaque modification
npm run list                              # identifiants et durées des schémas
node render.mjs --png --scale=1 <préfixe> # rendu rapide d'un schéma (1920x1080) dans out/png
node render.mjs --mp4 <préfixe>           # vidéo
npm run studio                            # aperçu interactif (serveur, ne termine pas)
```

Pas de tests automatisés : la vérification = `typecheck` + rendu PNG + **regarder l'image**.

## Fonctionnement (à comprendre avant de toucher au moteur)

- Chaque schéma est un composant React **fonction du numéro de frame** (`useCurrentFrame()`).
  Remotion bundle `src/` avec webpack, ouvre la page dans Chrome headless, capture chaque
  frame, et FFmpeg assemble les captures en MP4. Pas d'IA, rendu déterministe.
- Le rendu doit être **pur** : jamais de `Math.random()`, `Date.now()`, `setTimeout`, état
  ni animation CSS. Tout se calcule à partir de `frame` (`interpolate`, `spring` de `remotion`).
  Pour un aléa : `random(seed)` de `remotion`.
- Prop `still` : `true` pour le PNG (`render.mjs` capture la dernière frame). Tout composant
  doit alors s'afficher dans son état final, sans paquets animés ni sous-titres.
- Ressources : `staticFile()` + `<Img>` de `remotion` (et non `<img>`), sinon la capture
  peut partir avant le chargement. Les polices passent par `loadFont` (`src/lib/theme.ts`).

## Structure

| Chemin | Rôle |
|---|---|
| `src/index.ts`, `src/Root.tsx` | point d'entrée ; une `<Composition>` par schéma, dans un `<Folder>` par projet |
| `src/registry.ts` | découverte auto (`require.context`) : tout fichier de `src/diagrams/**` avec un `export default` tableau d'`Entry` |
| `src/lib/entries.ts` | `diagram(spec)`, `sequence(spec)`, `custom(id, Composant, duréeEnFrames)` |
| `src/lib/Diagram.tsx` | moteur des schémas boîtes/flèches (types `DiagramSpec`, `NodeSpec`, `EdgeSpec`…), `Header`, `Footer`, `Captions` |
| `src/lib/Sequence.tsx` | moteur des diagrammes de séquence (`SeqSpec`) |
| `src/lib/icons.tsx` | `<Icon name="aws:… / si:… / x:…">` ; pictogrammes maison dans `GLYPHS` |
| `src/lib/theme.ts` | palette `C`, police, canevas `W`=1920 `H`=1080 `FPS`=30 |
| `src/diagrams/exemples/` | seuls schémas versionnés : modèles à copier |
| `src/diagrams/<autre>/` | schémas des utilisateurs, **ignorés par git** (ne pas les ajouter) |
| `scripts/assets.mjs` | `postinstall` : copie icônes AWS (`aws-icons`) et police Inter dans `public/` |
| `render.mjs` | rendu en ligne de commande (options en tête de fichier) |
| `apercu/` | PNG des exemples, affichés dans le README |

`public/aws`, `public/fonts`, `out/`, `docs/`, `livrables/`, `site/` sont ignorés par git.

## Créer ou modifier un schéma

1. Partir d'un exemple : `cp -r src/diagrams/exemples src/diagrams/<projet>`, puis changer
   les `id` (uniques entre tous les projets, sinon erreur au chargement) et la liste exportée
   par `index.ts`.
2. Repères : canevas 1920 x 1080 ; `x, y` d'un **nœud = son centre**, d'un **groupe = coin
   haut gauche** ; l'en-tête occupe y < ~150 ; garder ~40 px de marge sur les bords.
3. Animation : `step` de chaque élément (décimales permises) ; apparition à la frame
   `20 + step * stepFrames`. Une flèche a en général le `step` de sa cible, les `captions`
   suivent les mêmes étapes. Dans une séquence, le `step` d'une caption = rang (à partir
   de 0) des items `msg` / `self` / `note`.
4. Icônes : vérifier qu'elles existent avant de les utiliser.
   - `aws:Nom` → `ls public/aws | grep -i <mot>` ;
   - `si:slug` → slug Simple Icons (`node -e "console.log(require('simple-icons').siKubernetes.slug)"`) ;
   - `x:` → clés de `GLYPHS` dans `src/lib/icons.tsx`.
5. Vérifier : `npm run typecheck`, puis `node render.mjs --png --scale=1 <id>` et **ouvrir
   le PNG** pour contrôler la mise en page. Défauts fréquents à corriger :
   - libellé de flèche qui chevauche un nœud, un titre de groupe ou une bordure (ajuster
     `labelT`, `labelDx`, `labelDy`) ;
   - flèche qui traverse un nœud (ajouter `via` ou `mid`) ;
   - texte qui déborde d'une carte (augmenter `w` ou `h`, couper avec `\n`) ;
   - groupes qui se recouvrent ou nœuds hors de leur groupe.
   Itérer jusqu'à un rendu propre, puis seulement rendre le MP4 si besoin.

## Modifier le moteur (`src/lib/`)

- Il est partagé par tous les projets : rester générique. Un besoin propre à un seul schéma
  passe par une option facultative du spec (avec une valeur par défaut qui ne change rien
  aux schémas existants) ou par un composant `custom(...)` dans le dossier du projet.
- Aucun nom de produit ni texte propre à un projet dans `src/lib/` (marque → `brand`,
  pied de page → `source`).
- Après une modification : `typecheck`, puis rendre **les deux exemples** et comparer avec
  `apercu/`. Si le rendu des exemples change volontairement, régénérer les aperçus :
  `node render.mjs --png --scale=1 --out=/tmp/rendu Exemple` puis copier
  `/tmp/rendu/png/Exemple-*.png` dans `apercu/`.
- Tenir `README.md` à jour (référence des propriétés) quand une option est ajoutée.

## À ne pas faire

- Versionner `public/aws`, `public/fonts`, `out/` ou les schémas hors de `exemples/`.
- Mettre un chemin propre à une machine dans le code (navigateur : variable `REMOTION_BROWSER`).
- Lancer `npm run render` sans filtre pour vérifier un seul schéma : tous les MP4 sont rendus,
  c'est long.
- Laisser `npm run studio` tourner au premier plan dans un outil qui attend la fin de la commande.
