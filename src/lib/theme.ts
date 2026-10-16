import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette inspirée des « AWS Architecture Icons » (catégories officielles) et du modèle C4.
export const C = {
  bg: '#FFFFFF',
  ink: '#232F3E', // « squid ink » AWS
  text: '#16191F',
  muted: '#5F6B7A',
  faint: '#8D99A8',
  line: '#545B64',
  hairline: '#D5DBDB',
  panel: '#F7F8F8',
  orange: '#FF9900',
  compute: '#ED7100',
  storage: '#7AA116',
  database: '#C925D1',
  network: '#8C4FFF',
  security: '#DD344C',
  mgmt: '#E7157B',
  teal: '#00A4A6',
  ml: '#01A88D',
  devtools: '#C925D1',
  blue: '#147EBA',
  c4person: '#08427B',
  c4system: '#1168BD',
  c4container: '#438DD5',
  c4component: '#85BBF0',
  c4external: '#8A8A8A',
  ok: '#1D8102',
  warn: '#D45B07',
  err: '#D13212',
};

export const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

let fontsLoaded: Promise<unknown> | null = null;
export const ensureFonts = () => {
  if (!fontsLoaded) {
    fontsLoaded = Promise.all(
      [400, 500, 600, 700, 800].map((w) =>
        loadFont({
          family: 'Inter',
          url: staticFile(`fonts/inter-latin-${w}-normal.woff2`),
          weight: String(w),
        }),
      ),
    );
  }
  return fontsLoaded;
};
