// Rendu des schémas : PNG (image fixe, dernière frame sans animation) + MP4 (animation).
//
// Usage : node render.mjs [options] [préfixe ...]
//   --png / --mp4        un seul format (par défaut : les deux)
//   --scale=2            facteur de résolution des PNG (2 => 3840x2160)
//   --out=out            dossier de sortie (sous-dossiers png/ et mp4/)
//   --concurrency=N      onglets de rendu en parallèle pour les MP4 (défaut : choix de Remotion)
//   --list               affiche les identifiants disponibles et s'arrête
//   préfixe              ne rend que les schémas dont l'identifiant commence ainsi
//
// Navigateur : Remotion télécharge son Chrome headless au premier rendu. Pour en utiliser un
// déjà installé, définir REMOTION_BROWSER=/chemin/vers/chrome (ou chrome-headless-shell).
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};
const only = args.filter((a) => !a.startsWith('--'));
const wantPng = args.includes('--png') || !args.includes('--mp4');
const wantMp4 = args.includes('--mp4') || !args.includes('--png');
const scale = Number(opt('scale', '2'));
const concurrency = opt('concurrency') ? Number(opt('concurrency')) : null;
const out = path.resolve(opt('out', path.join(root, 'out')));
const browserExecutable = process.env.REMOTION_BROWSER || null;

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const all = await getCompositions(serveUrl, {browserExecutable, inputProps: {still: false}});

if (args.includes('--list')) {
  for (const c of all) console.log(`${c.id}  (${(c.durationInFrames / c.fps).toFixed(1)} s)`);
  process.exit(0);
}

const ids = all.map((c) => c.id).filter((id) => only.length === 0 || only.some((o) => id.startsWith(o)));
if (ids.length === 0) {
  console.error(`aucun schéma ne correspond à : ${only.join(' ')} (voir --list)`);
  process.exit(1);
}
if (wantPng) mkdirSync(path.join(out, 'png'), {recursive: true});
if (wantMp4) mkdirSync(path.join(out, 'mp4'), {recursive: true});

for (const id of ids) {
  if (wantPng) {
    const comp = await selectComposition({serveUrl, id, inputProps: {still: true}, browserExecutable});
    const file = path.join(out, 'png', `${id}.png`);
    await renderStill({
      composition: comp,
      serveUrl,
      output: file,
      frame: comp.durationInFrames - 1,
      inputProps: {still: true},
      scale,
      browserExecutable,
    });
    console.log(`PNG  ${file}`);
  }
  if (wantMp4) {
    const comp = await selectComposition({serveUrl, id, inputProps: {still: false}, browserExecutable});
    const file = path.join(out, 'mp4', `${id}.mp4`);
    await renderMedia({
      composition: comp,
      serveUrl,
      codec: 'h264',
      crf: 20,
      outputLocation: file,
      inputProps: {still: false},
      browserExecutable,
      concurrency,
    });
    console.log(`MP4  ${file}`);
  }
}
