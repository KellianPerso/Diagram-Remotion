// Copie les ressources statiques depuis node_modules vers public/ (lancé par `npm install`).
// - public/aws/<Nom>.svg : toutes les icônes AWS (paquet aws-icons), à plat
// - public/fonts/        : police Inter (paquet @fontsource/inter)
import {copyFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const pkgDir = (name) => path.dirname(require.resolve(`${name}/package.json`));

// en cas de doublon de nom, la première catégorie gagne
const awsDir = path.join(pkgDir('aws-icons'), 'icons');
const categories = ['architecture-service', 'architecture-group', 'resource', 'category'];
const awsOut = path.join(root, 'public/aws');
mkdirSync(awsOut, {recursive: true});
const seen = new Set();
for (const cat of categories) {
  const dir = path.join(awsDir, cat);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    if (seen.has(f)) continue;
    seen.add(f);
    copyFileSync(path.join(dir, f), path.join(awsOut, f));
  }
}

const fontsOut = path.join(root, 'public/fonts');
mkdirSync(fontsOut, {recursive: true});
for (const w of [400, 500, 600, 700, 800]) {
  const f = `inter-latin-${w}-normal.woff2`;
  copyFileSync(path.join(pkgDir('@fontsource/inter'), 'files', f), path.join(fontsOut, f));
}

console.log(`assets : ${seen.size} icônes AWS -> public/aws, police Inter -> public/fonts`);
