export type Pt = [number, number];

export const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export const polyLength = (pts: Pt[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += segLen(pts[i - 1], pts[i]);
  return l;
};

// point et angle (radians) à la distance d le long de la polyligne
export const pointAt = (pts: Pt[], d: number): {p: Pt; angle: number} => {
  let rest = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = segLen(a, b);
    if (rest <= l || i === pts.length - 1) {
      const t = l === 0 ? 0 : Math.min(1, rest / l);
      return {
        p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
      };
    }
    rest -= l;
  }
  return {p: pts[pts.length - 1], angle: 0};
};

// début de la polyligne jusqu'à la distance d
export const partial = (pts: Pt[], d: number): Pt[] => {
  const out: Pt[] = [pts[0]];
  let rest = d;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = segLen(a, b);
    if (rest >= l) {
      out.push(b);
      rest -= l;
    } else {
      const t = l === 0 ? 0 : rest / l;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      break;
    }
  }
  return out;
};

// chemin SVG à coins arrondis
export const roundedPath = (pts: Pt[], r = 12) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const l1 = segLen(p0, p1);
    const l2 = segLen(p1, p2);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: Pt = [p1[0] - ((p1[0] - p0[0]) / l1) * rr, p1[1] - ((p1[1] - p0[1]) / l1) * rr];
    const b: Pt = [p1[0] + ((p2[0] - p1[0]) / l2) * rr, p1[1] + ((p2[1] - p1[1]) / l2) * rr];
    d += ` L ${a[0]} ${a[1]} Q ${p1[0]} ${p1[1]} ${b[0]} ${b[1]}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
};
