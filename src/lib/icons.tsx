import React from 'react';
import {Img, staticFile} from 'remotion';
import {
  siApacheparquet,
  siDocker,
  siFastapi,
  siGithub,
  siGithubactions,
  siGrafana,
  siInfluxdb,
  siJsonwebtokens,
  siMlflow,
  siNginx,
  siPostgresql,
  siPrometheus,
  siPydantic,
  siPython,
  siReact,
  siScikitlearn,
  siSqlalchemy,
  siTerraform,
  siVite,
} from 'simple-icons';
import * as simpleIcons from 'simple-icons';
import {C} from './theme';

// Icônes de marque (simple-icons, CC0), dessinées comme les icônes de service AWS :
// tuile carrée de la couleur de la marque, pictogramme blanc (ou sombre si la couleur est claire).
const BRANDS: Record<string, {path: string; hex: string}> = {
  github: siGithub,
  githubactions: siGithubactions,
  docker: siDocker,
  react: siReact,
  fastapi: siFastapi,
  influxdb: siInfluxdb,
  postgresql: siPostgresql,
  mlflow: siMlflow,
  scikitlearn: siScikitlearn,
  python: siPython,
  nginx: siNginx,
  terraform: siTerraform,
  grafana: siGrafana,
  prometheus: siPrometheus,
  vite: siVite,
  jwt: siJsonwebtokens,
  parquet: siApacheparquet,
  pydantic: siPydantic,
  sqlalchemy: siSqlalchemy,
};

// Toute autre marque de simple-icons par son slug (https://simpleicons.org) : « si:kubernetes »
const brand = (slug: string): {path: string; hex: string} | undefined =>
  BRANDS[slug] ??
  (simpleIcons as unknown as Record<string, {path: string; hex: string}>)[`si${slug[0].toUpperCase()}${slug.slice(1)}`];

// pictogramme sombre sur une tuile trop claire
const isLight = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 186;
};

// Couleurs de tuile imposées quand la couleur officielle est trop claire ou trop sombre
const BRAND_BG: Record<string, string> = {
  react: '#20232A',
  github: '#24292F',
  jwt: '#000000',
  vite: '#646CFF',
  mlflow: '#0194E2',
  influxdb: '#22ADF6',
  scikitlearn: '#F7931E',
  parquet: '#50ABF1',
  pydantic: '#E92063',
  sqlalchemy: '#D71F00',
  python: '#3776AB',
};
const BRAND_FG: Record<string, string> = {react: '#61DAFB'};

// Pictogrammes maison (même style : tuile + trait blanc)
const GLYPHS: Record<string, {bg: string; draw: React.ReactNode}> = {
  clock: {
    bg: C.mgmt,
    draw: (
      <>
        <circle cx={24} cy={24} r={13} />
        <path d="M24 15v9l6 4" />
      </>
    ),
  },
  gear: {
    bg: C.compute,
    draw: (
      <>
        <circle cx={24} cy={24} r={5} />
        <path d="M24 10v5M24 33v5M10 24h5M33 24h5M14 14l3.5 3.5M30.5 30.5 34 34M34 14l-3.5 3.5M17.5 30.5 14 34" />
        <circle cx={24} cy={24} r={10} />
      </>
    ),
  },
  rules: {
    bg: C.mgmt,
    draw: (
      <>
        <rect x={13} y={11} width={22} height={26} rx={2} />
        <path d="M17 18h4M17 24h4M17 30h4M24 18h7M24 24h7M24 30h7" />
      </>
    ),
  },
  chart: {
    bg: C.ml,
    draw: (
      <>
        <path d="M12 36h24M12 36V12" />
        <path d="M15 30l6-7 5 4 8-11" />
        <path d="M15 27l6-3 5 1 8-5" strokeDasharray="2 2" />
      </>
    ),
  },
  db: {
    bg: C.database,
    draw: (
      <>
        <ellipse cx={24} cy={14} rx={11} ry={4} />
        <path d="M13 14v20c0 2.2 4.9 4 11 4s11-1.8 11-4V14M13 24c0 2.2 4.9 4 11 4s11-1.8 11-4" />
      </>
    ),
  },
  file: {
    bg: C.storage,
    draw: (
      <>
        <path d="M15 10h12l7 7v21H15z" />
        <path d="M27 10v7h7M19 24h11M19 29h11" />
      </>
    ),
  },
  key: {
    bg: C.security,
    draw: (
      <>
        <circle cx={18} cy={24} r={6} />
        <path d="M24 24h13M33 24v5M29 24v4" />
      </>
    ),
  },
  bolt: {
    bg: C.orange,
    draw: <path d="M26 9 14 27h9l-2 12 13-19h-9z" />,
  },
  shield: {
    bg: C.security,
    draw: (
      <>
        <path d="M24 10l12 4v9c0 8-5.5 13-12 15-6.5-2-12-7-12-15v-9z" />
        <path d="M19 24l4 4 7-8" />
      </>
    ),
  },
  bell: {
    bg: C.err,
    draw: (
      <>
        <path d="M16 31V22a8 8 0 0 1 16 0v9l2 3H14z" />
        <path d="M21 36a3 3 0 0 0 6 0" />
      </>
    ),
  },
  user: {
    bg: C.c4person,
    draw: (
      <>
        <circle cx={24} cy={18} r={6} />
        <path d="M13 37c1-7 5-10 11-10s10 3 11 10" />
      </>
    ),
  },
  browser: {
    bg: C.blue,
    draw: (
      <>
        <rect x={10} y={13} width={28} height={22} rx={2} />
        <path d="M10 19h28M14 16h1M17 16h1" />
      </>
    ),
  },
  sensor: {
    bg: C.storage,
    draw: (
      <>
        <circle cx={24} cy={26} r={3} />
        <path d="M18 20a8.5 8.5 0 0 1 12 0M14 16a14 14 0 0 1 20 0M18 32h12l-2 5h-8z" />
      </>
    ),
  },
  queue: {
    bg: C.mgmt,
    draw: (
      <>
        <rect x={11} y={18} width={7} height={12} />
        <rect x={20.5} y={18} width={7} height={12} />
        <rect x={30} y={18} width={7} height={12} />
      </>
    ),
  },
  lake: {
    bg: C.storage,
    draw: (
      <>
        <path d="M10 20c4-3 8 3 14 0s10-3 14 0M10 27c4-3 8 3 14 0s10-3 14 0M10 34c4-3 8 3 14 0s10-3 14 0" />
        <path d="M24 9v7" />
      </>
    ),
  },
};

export type IconName = string; // "aws:AmazonEC2", "si:github", "x:clock"

export const Icon: React.FC<{name: IconName; size?: number; style?: React.CSSProperties}> = ({
  name,
  size = 64,
  style,
}) => {
  const [ns, id] = name.split(':');
  if (ns === 'aws') {
    return (
      <Img
        src={staticFile(`aws/${id}.svg`)}
        style={{width: size, height: size, display: 'block', ...style}}
      />
    );
  }
  if (ns === 'si') {
    const b = brand(id);
    if (!b) throw new Error(`icône inconnue ${name} (slug simple-icons attendu)`);
    const bg = BRAND_BG[id] ?? `#${b.hex}`;
    const fg = BRAND_FG[id] ?? (isLight(bg) ? '#16191F' : '#FFFFFF');
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', ...style}}>
        <rect width={64} height={64} fill={bg} />
        <g transform="translate(14 14) scale(1.5)">
          <path d={b.path} fill={fg} />
        </g>
      </svg>
    );
  }
  const g = ns === 'x' ? GLYPHS[id] : undefined;
  if (!g) throw new Error(`icône inconnue ${name} (préfixes : aws:, si:, x:)`);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{display: 'block', ...style}}>
      <rect width={48} height={48} fill={g.bg} />
      <g fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {g.draw}
      </g>
    </svg>
  );
};
