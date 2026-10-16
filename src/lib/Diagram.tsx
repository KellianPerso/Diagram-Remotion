import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Pt, partial, pointAt, polyLength, roundedPath} from './geometry';
import {Icon} from './icons';
import {C, FONT} from './theme';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Anchor = [string, Side, number?] | Pt;

export type GroupStyle =
  | 'cloud'
  | 'account'
  | 'region'
  | 'vpc'
  | 'az'
  | 'public'
  | 'private'
  | 'sg'
  | 'ec2'
  | 'generic'
  | 'c4'
  | 'server'
  | 'docker'
  | 'github';

export interface GroupSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  style: GroupStyle;
  step: number;
  icon?: string;
}

export interface NodeSpec {
  id: string;
  x: number; // centre
  y: number;
  kind?: 'icon' | 'card' | 'chip';
  icon?: string;
  title: string;
  tech?: string;
  desc?: string;
  w?: number;
  h?: number;
  size?: number;
  color?: string;
  step: number;
  external?: boolean;
  tag?: string; // petit badge en haut à droite (ex. « interne »)
}

export interface EdgeSpec {
  from: Anchor;
  to: Anchor;
  via?: Pt[];
  mid?: number; // position du coude (x ou y selon l'orientation)
  label?: string;
  labelT?: number;
  labelDx?: number;
  labelDy?: number;
  num?: number;
  step: number;
  color?: string;
  dashed?: boolean;
  packets?: number;
  packetColor?: string;
  both?: boolean; // flèche et paquets dans les deux sens
  width?: number;
}

export interface NoteSpec {
  x: number;
  y: number;
  w: number;
  title?: string;
  lines: string[];
  step: number;
  tone?: 'info' | 'warn' | 'ok' | 'neutral';
  icon?: string;
}

export interface StepItem {
  num: number;
  text: string;
  step?: number;
}

export interface DiagramSpec {
  id: string;
  title: string;
  brand?: string; // sur-titre (nom du produit / projet), masqué si absent
  subtitle?: string;
  tag?: string;
  source?: string;
  groups?: GroupSpec[];
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  notes?: NoteSpec[];
  steps?: {x: number; y: number; w: number; title?: string; items: StepItem[]};
  legend?: {x: number; y: number; items: {color: string; text: string; dashed?: boolean}[]; step?: number};
  captions?: {step: number; text: string}[];
  stepFrames?: number;
  hold?: number;
}

export const T0 = 20;
const DRAW = 22;

export const diagramDuration = (s: DiagramSpec) => {
  const sf = s.stepFrames ?? 20;
  const all = [
    ...(s.groups ?? []).map((g) => g.step),
    ...s.nodes.map((n) => n.step),
    ...s.edges.map((e) => e.step),
    ...(s.notes ?? []).map((n) => n.step),
  ];
  const max = Math.max(0, ...all);
  return Math.ceil(T0 + (max + 1) * sf + DRAW + (s.hold ?? 180));
};

// ------------------------------------------------------------------ géométrie des ancres
type Box = {cx: number; cy: number; w: number; h: number; below?: number};

const nodeBox = (n: NodeSpec): Box => {
  if ((n.kind ?? 'card') === 'icon') {
    const s = n.size ?? 64;
    // l'ancre « bottom » d'une icône passe sous son libellé
    const lines = n.tech ? n.tech.split('\n').length : 0;
    const below = (n.title ? 30 : 4) + lines * 17;
    return {cx: n.x, cy: n.y, w: s, h: s, below};
  }
  if (n.kind === 'chip') return {cx: n.x, cy: n.y, w: n.w ?? 200, h: n.h ?? 52};
  return {cx: n.x, cy: n.y, w: n.w ?? 300, h: n.h ?? 112};
};

const groupBox = (g: GroupSpec): Box => ({cx: g.x + g.w / 2, cy: g.y + g.h / 2, w: g.w, h: g.h});

const anchorPoint = (a: Anchor, boxes: Record<string, Box>): {p: Pt; side?: Side} => {
  if (typeof a[0] === 'number') return {p: a as Pt};
  const [id, side, off = 0] = a as [string, Side, number?];
  const b = boxes[id];
  if (!b) throw new Error(`ancre inconnue : ${id}`);
  switch (side) {
    case 'top':
      return {p: [b.cx + off, b.cy - b.h / 2], side};
    case 'bottom':
      return {p: [b.cx + off, b.cy + b.h / 2 + (b.below ?? 0)], side};
    case 'left':
      return {p: [b.cx - b.w / 2, b.cy + off], side};
    case 'right':
      return {p: [b.cx + b.w / 2, b.cy + off], side};
  }
};

const horiz = (s?: Side) => s === 'left' || s === 'right';

export const routeEdge = (e: EdgeSpec, boxes: Record<string, Box>): Pt[] => {
  const A = anchorPoint(e.from, boxes);
  const B = anchorPoint(e.to, boxes);
  const [sx, sy] = A.p;
  const [ex, ey] = B.p;
  if (e.via) return [A.p, ...e.via, B.p];
  if (Math.abs(sx - ex) < 1 || Math.abs(sy - ey) < 1) return [A.p, B.p];
  const aH = A.side ? horiz(A.side) : !horiz(B.side);
  const bH = B.side ? horiz(B.side) : aH;
  if (aH && bH) {
    const mx = e.mid ?? (sx + ex) / 2;
    return [A.p, [mx, sy], [mx, ey], B.p];
  }
  if (!aH && !bH) {
    const my = e.mid ?? (sy + ey) / 2;
    return [A.p, [sx, my], [ex, my], B.p];
  }
  if (aH && !bH) return [A.p, [ex, sy], B.p];
  return [A.p, [sx, ey], B.p];
};

// ------------------------------------------------------------------ animation
const useAppear = (step: number, sf: number, still: boolean) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (still) return 1;
  return spring({frame: frame - (T0 + step * sf), fps, config: {damping: 200}, durationInFrames: 18});
};

// ------------------------------------------------------------------ groupes (style AWS)
const GROUP_STYLE: Record<
  GroupStyle,
  {border: string; dash?: boolean; fill?: string; icon?: string; text: string; center?: boolean; width?: number}
> = {
  cloud: {border: C.ink, icon: 'aws:AWSCloudlogo', text: C.ink},
  account: {border: C.mgmt, icon: 'aws:AWSAccount', text: C.mgmt},
  region: {border: C.teal, dash: true, icon: 'aws:Region', text: C.teal},
  vpc: {border: C.network, icon: 'aws:VirtualprivatecloudVPC', text: C.network},
  az: {border: C.teal, dash: true, text: C.teal, center: true, width: 1.5},
  public: {border: 'transparent', fill: '#F2F6E8', icon: 'aws:Publicsubnet', text: '#248814'},
  private: {border: 'transparent', fill: '#E6F6F7', icon: 'aws:Privatesubnet', text: '#007B7D'},
  sg: {border: C.security, dash: true, text: C.security, width: 1.5},
  ec2: {border: C.compute, icon: 'aws:EC2instancecontents', text: C.compute},
  generic: {border: '#7D8998', dash: true, text: C.muted},
  c4: {border: '#444B55', dash: true, text: '#444B55', width: 2},
  server: {border: '#7D8998', icon: 'aws:Servercontents', text: C.muted},
  docker: {border: '#1D63ED', dash: true, icon: 'si:docker', text: '#1D63ED', width: 1.5},
  github: {border: '#24292F', icon: 'si:github', text: '#24292F'},
};

const Group: React.FC<{g: GroupSpec; sf: number; still: boolean}> = ({g, sf, still}) => {
  const a = useAppear(g.step, sf, still);
  const st = GROUP_STYLE[g.style];
  const icon = g.icon ?? st.icon;
  return (
    <div
      style={{
        position: 'absolute',
        left: g.x,
        top: g.y,
        width: g.w,
        height: g.h,
        border: `${st.width ?? 2}px ${st.dash ? 'dashed' : 'solid'} ${st.border}`,
        background: st.fill ?? 'transparent',
        opacity: a,
        transform: `scale(${0.985 + 0.015 * a})`,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: g.style === 'c4' ? 12 : 0,
          right: st.center ? 0 : undefined,
          top: g.style === 'c4' ? undefined : 0,
          bottom: g.style === 'c4' ? 8 : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: st.center ? 'center' : 'flex-start',
          gap: 10,
          paddingRight: 10,
        }}
      >
        {icon ? <Icon name={icon} size={34} /> : null}
        <div style={{paddingTop: st.center ? 6 : 0}}>
          <div style={{fontSize: 17, fontWeight: 700, color: st.text, whiteSpace: 'nowrap'}}>{g.label}</div>
          {g.sub ? (
            <div style={{fontSize: 13, color: C.muted, whiteSpace: 'nowrap', marginTop: 1}}>{g.sub}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ nœuds
const Node: React.FC<{n: NodeSpec; sf: number; still: boolean}> = ({n, sf, still}) => {
  const a = useAppear(n.step, sf, still);
  const b = nodeBox(n);
  const common: React.CSSProperties = {
    position: 'absolute',
    opacity: a,
    transform: `translateY(${(1 - a) * 14}px) scale(${0.92 + 0.08 * a})`,
  };
  const kind = n.kind ?? 'card';
  if (kind === 'icon') {
    const s = b.w;
    const lw = n.w ?? 220;
    return (
      <div style={{...common, left: n.x - lw / 2, top: n.y - s / 2, width: lw, textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center', position: 'relative'}}>
          <div style={{boxShadow: n.external ? 'none' : '0 2px 6px rgba(0,0,0,0.12)'}}>
            <Icon name={n.icon ?? 'aws:GenericApplication'} size={s} />
          </div>
        </div>
        <div style={{fontSize: 16, fontWeight: 700, color: C.text, marginTop: 8, lineHeight: 1.2}}>
          {n.title}
        </div>
        {n.tech ? (
          <div style={{fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 1.25, whiteSpace: 'pre-line'}}>
            {n.tech}
          </div>
        ) : null}
      </div>
    );
  }
  const color = n.color ?? C.c4container;
  if (kind === 'chip') {
    return (
      <div
        style={{
          ...common,
          left: n.x - b.w / 2,
          top: n.y - b.h / 2,
          width: b.w,
          height: b.h,
          boxSizing: 'border-box',
          background: '#fff',
          border: `1.5px solid ${color}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {n.icon ? <Icon name={n.icon} size={30} /> : null}
        <div style={{minWidth: 0}}>
          <div style={{fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.15}}>{n.title}</div>
          {n.tech ? <div style={{fontSize: 12, color: C.muted, lineHeight: 1.2}}>{n.tech}</div> : null}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        ...common,
        left: n.x - b.w / 2,
        top: n.y - b.h / 2,
        width: b.w,
        height: b.h,
        boxSizing: 'border-box',
        background: n.external ? '#F4F5F6' : '#fff',
        border: `1.5px ${n.external ? 'dashed' : 'solid'} ${n.external ? '#9AA3AE' : color}`,
        borderLeft: `7px solid ${n.external ? '#9AA3AE' : color}`,
        borderRadius: 6,
        display: 'flex',
        gap: 14,
        padding: '12px 14px',
        boxShadow: n.external ? 'none' : '0 2px 8px rgba(35,47,62,0.10)',
      }}
    >
      {n.icon ? (
        <div style={{flex: 'none'}}>
          <Icon name={n.icon} size={42} />
        </div>
      ) : null}
      <div style={{minWidth: 0, flex: 1}}>
        <div style={{fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.15}}>{n.title}</div>
        {n.tech ? (
          <div style={{fontSize: 12.5, color: color === C.c4component ? '#2B6CB0' : color, fontWeight: 600, marginTop: 3}}>
            {n.tech}
          </div>
        ) : null}
        {n.desc ? (
          <div style={{fontSize: 13.5, color: C.muted, marginTop: 5, lineHeight: 1.3, whiteSpace: 'pre-line'}}>
            {n.desc}
          </div>
        ) : null}
      </div>
      {n.tag ? (
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: -11,
            background: color,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 10,
            letterSpacing: 0.3,
          }}
        >
          {n.tag}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ arêtes
const NumBadge: React.FC<{n: number; size?: number}> = ({n, size = 28}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: C.ink,
      color: '#fff',
      fontSize: size * 0.52,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      boxShadow: `0 0 0 3px ${C.orange}`,
    }}
  >
    {n}
  </div>
);

interface Routed {
  e: EdgeSpec;
  pts: Pt[];
  len: number;
}

const EdgeLine: React.FC<{r: Routed; sf: number; still: boolean}> = ({r, sf, still}) => {
  const frame = useCurrentFrame();
  const {e, pts, len} = r;
  const start = T0 + e.step * sf;
  const p = still
    ? 1
    : interpolate(frame, [start, start + DRAW], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });
  if (p <= 0) return null;
  const color = e.color ?? C.line;
  const shown = partial(pts, len * p);
  const tip = pointAt(pts, len * p);
  const w = e.width ?? 2.2;
  const head = (pt: Pt, ang: number) => {
    const L = 12;
    const s = 6;
    const [x, y] = pt;
    const bx = x - Math.cos(ang) * L;
    const by = y - Math.sin(ang) * L;
    return `${x},${y} ${bx + Math.sin(ang) * s},${by - Math.cos(ang) * s} ${bx - Math.sin(ang) * s},${by + Math.cos(ang) * s}`;
  };
  const startPt = pointAt(pts, 0);
  return (
    <g>
      <path
        d={roundedPath(shown)}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeDasharray={e.dashed ? '8 6' : undefined}
        strokeLinejoin="round"
      />
      <polygon points={head(tip.p, tip.angle)} fill={color} />
      {e.both && p >= 1 ? <polygon points={head(startPt.p, startPt.angle + Math.PI)} fill={color} /> : null}
    </g>
  );
};

const Packets: React.FC<{r: Routed; sf: number}> = ({r, sf}) => {
  const frame = useCurrentFrame();
  const {e, pts, len} = r;
  const n = e.packets ?? 2;
  if (n <= 0) return null;
  const start = T0 + e.step * sf + DRAW;
  if (frame < start) return null;
  const speed = 4.2;
  const fade = interpolate(frame, [start, start + 12], [0, 1], {extrapolateRight: 'clamp'});
  const color = e.packetColor ?? C.orange;
  const out: React.ReactNode[] = [];
  const dirs = e.both ? [1, -1] : [1];
  for (const dir of dirs) {
    for (let k = 0; k < n; k++) {
      let d = ((frame - start) * speed + (k * len) / n) % len;
      if (dir < 0) d = len - d;
      const {p} = pointAt(pts, d);
      const edgeFade = Math.min(1, d / 30, (len - d) / 30);
      out.push(
        <circle
          key={`${dir}-${k}`}
          cx={p[0]}
          cy={p[1]}
          r={6}
          fill={dir < 0 ? C.blue : color}
          opacity={fade * edgeFade}
          filter="url(#glow)"
        />,
      );
    }
  }
  return <g>{out}</g>;
};

const EdgeLabel: React.FC<{r: Routed; sf: number; still: boolean}> = ({r, sf, still}) => {
  const frame = useCurrentFrame();
  const {e, pts, len} = r;
  if (!e.label && e.num === undefined) return null;
  const start = T0 + e.step * sf + DRAW * 0.6;
  const a = still ? 1 : interpolate(frame, [start, start + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const {p} = pointAt(pts, len * (e.labelT ?? 0.5));
  const x = p[0] + (e.labelDx ?? 0);
  const y = p[1] + (e.labelDy ?? 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * a})`,
        opacity: a,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {e.num !== undefined ? <NumBadge n={e.num} /> : null}
      {e.label ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.94)',
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 13.5,
            fontWeight: 500,
            color: e.color && e.color !== C.line ? e.color : C.ink,
            lineHeight: 1.25,
            whiteSpace: 'pre',
            textAlign: 'center',
            border: `1px solid ${C.hairline}`,
          }}
        >
          {e.label}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ notes, étapes, légende
const TONES = {
  info: {bg: '#F0F7FD', border: C.blue},
  warn: {bg: '#FFF7EB', border: C.orange},
  ok: {bg: '#F1F8EC', border: C.ok},
  neutral: {bg: '#F7F8F8', border: '#AAB7B8'},
};

const Note: React.FC<{n: NoteSpec; sf: number; still: boolean}> = ({n, sf, still}) => {
  const a = useAppear(n.step, sf, still);
  const t = TONES[n.tone ?? 'neutral'];
  return (
    <div
      style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        width: n.w,
        boxSizing: 'border-box',
        background: t.bg,
        borderLeft: `4px solid ${t.border}`,
        borderRadius: 4,
        padding: '10px 14px',
        opacity: a,
        transform: `translateX(${(1 - a) * 16}px)`,
      }}
    >
      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
        {n.icon ? <Icon name={n.icon} size={26} /> : null}
        {n.title ? <div style={{fontSize: 15, fontWeight: 700, color: C.ink}}>{n.title}</div> : null}
      </div>
      {n.lines.map((l, i) => (
        <div key={i} style={{fontSize: 13.5, color: C.text, marginTop: 4, lineHeight: 1.35}}>
          {l}
        </div>
      ))}
    </div>
  );
};

const StepsPanel: React.FC<{spec: DiagramSpec; sf: number; still: boolean}> = ({spec, sf, still}) => {
  const frame = useCurrentFrame();
  const s = spec.steps!;
  return (
    <div style={{position: 'absolute', left: s.x, top: s.y, width: s.w}}>
      {s.title ? (
        <div style={{fontSize: 15, fontWeight: 800, color: C.ink, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase'}}>
          {s.title}
        </div>
      ) : null}
      {s.items.map((it) => {
        const step = it.step ?? spec.edges.find((e) => e.num === it.num)?.step ?? 0;
        const start = T0 + step * sf;
        const a = still ? 1 : interpolate(frame, [start, start + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const active = !still && frame >= start && frame < start + sf * 1.5;
        return (
          <div
            key={it.num}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              marginBottom: 9,
              opacity: 0.15 + 0.85 * a,
              background: active ? '#FFF4E0' : 'transparent',
              borderRadius: 6,
              padding: '3px 4px',
            }}
          >
            <NumBadge n={it.num} size={24} />
            <div style={{fontSize: 14, color: C.text, lineHeight: 1.35, paddingTop: 2}}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

const Legend: React.FC<{spec: DiagramSpec; sf: number; still: boolean}> = ({spec, sf, still}) => {
  const l = spec.legend!;
  const a = useAppear(l.step ?? 0, sf, still);
  return (
    <div style={{position: 'absolute', left: l.x, top: l.y, display: 'flex', gap: 22, opacity: a}}>
      {l.items.map((it, i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <svg width={38} height={10}>
            <line x1={0} y1={5} x2={30} y2={5} stroke={it.color} strokeWidth={2.5} strokeDasharray={it.dashed ? '6 4' : undefined} />
            <polygon points="38,5 29,1 29,9" fill={it.color} />
          </svg>
          <div style={{fontSize: 13.5, color: C.muted}}>{it.text}</div>
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ en-tête, légende, sous-titres
export const Header: React.FC<{title: string; subtitle?: string; tag?: string; brand?: string; still: boolean}> = ({
  title,
  brand,
  subtitle,
  tag,
  still,
}) => {
  const frame = useCurrentFrame();
  const a = still ? 1 : interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 48, top: 30, right: 48, opacity: a}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        {brand ? (
          <>
            <div style={{width: 6, height: 22, background: C.orange}} />
            <div style={{fontSize: 15, fontWeight: 700, letterSpacing: 1.5, color: C.compute, textTransform: 'uppercase'}}>
              {brand}
            </div>
          </>
        ) : null}
        {tag ? (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              background: C.ink,
              padding: '5px 12px',
              borderRadius: 4,
              letterSpacing: 0.5,
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
      <div style={{fontSize: 38, fontWeight: 800, color: C.ink, marginTop: 6, letterSpacing: -0.5}}>{title}</div>
      {subtitle ? <div style={{fontSize: 17, color: C.muted, marginTop: 2}}>{subtitle}</div> : null}
    </div>
  );
};

export const Footer: React.FC<{source?: string}> = ({source}) =>
  source ? (
  <div
    style={{
      position: 'absolute',
      left: 48,
      bottom: 16,
      fontSize: 12,
      color: C.faint,
    }}
  >
    {source}
  </div>
  ) : null;

export const Captions: React.FC<{captions?: {step: number; text: string}[]; sf: number; still: boolean}> = ({
  captions,
  sf,
  still,
}) => {
  const frame = useCurrentFrame();
  if (still || !captions?.length) return null;
  const sorted = [...captions].sort((a, b) => a.step - b.step);
  let idx = -1;
  for (let i = 0; i < sorted.length; i++) if (frame >= T0 + sorted[i].step * sf) idx = i;
  if (idx < 0) return null;
  const c = sorted[idx];
  const start = T0 + c.step * sf;
  const a = interpolate(frame, [start, start + 10], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        right: 48,
        top: 84,
        transform: `translateY(${(1 - a) * -8}px)`,
        opacity: a,
        background: 'rgba(35,47,62,0.95)',
        color: '#fff',
        padding: '9px 18px',
        borderRadius: 8,
        fontSize: 18,
        fontWeight: 500,
        maxWidth: 1000,
        textAlign: 'left',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
        borderLeft: `5px solid ${C.orange}`,
      }}
    >
      {c.text}
    </div>
  );
};

export const GlowDefs = () => (
  <defs>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ------------------------------------------------------------------ composition
export const Diagram: React.FC<{spec: DiagramSpec; still?: boolean}> = ({spec, still = false}) => {
  const {width, height} = useVideoConfig();
  const sf = spec.stepFrames ?? 20;
  const boxes: Record<string, Box> = {};
  for (const g of spec.groups ?? []) boxes[g.id] = groupBox(g);
  for (const n of spec.nodes) boxes[n.id] = nodeBox(n);
  const routed: Routed[] = spec.edges.map((e) => {
    const pts = routeEdge(e, boxes);
    return {e, pts, len: polyLength(pts)};
  });
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT}}>
      <Header title={spec.title} subtitle={spec.subtitle} tag={spec.tag} brand={spec.brand} still={still} />
      {(spec.groups ?? []).map((g) => (
        <Group key={g.id} g={g} sf={sf} still={still} />
      ))}
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
        <GlowDefs />
        {routed.map((r, i) => (
          <EdgeLine key={i} r={r} sf={sf} still={still} />
        ))}
      </svg>
      {spec.nodes.map((n) => (
        <Node key={n.id} n={n} sf={sf} still={still} />
      ))}
      {!still ? (
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
          <GlowDefs />
          {routed.map((r, i) => (
            <Packets key={i} r={r} sf={sf} />
          ))}
        </svg>
      ) : null}
      {routed.map((r, i) => (
        <EdgeLabel key={i} r={r} sf={sf} still={still} />
      ))}
      {(spec.notes ?? []).map((n, i) => (
        <Note key={i} n={n} sf={sf} still={still} />
      ))}
      {spec.steps ? <StepsPanel spec={spec} sf={sf} still={still} /> : null}
      {spec.legend ? <Legend spec={spec} sf={sf} still={still} /> : null}
      <Footer source={spec.source} />
      <Captions captions={spec.captions} sf={sf} still={still} />
    </AbsoluteFill>
  );
};
