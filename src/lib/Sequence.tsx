import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions, Footer, GlowDefs, Header, T0} from './Diagram';
import {Icon} from './icons';
import {C, FONT} from './theme';

export interface Participant {
  id: string;
  title: string;
  tech?: string;
  icon: string;
}

export type SeqItem =
  | {kind: 'msg'; from: string; to: string; label: string; reply?: boolean; num?: number; color?: string}
  | {kind: 'self'; on: string; label: string; color?: string; num?: number}
  | {kind: 'note'; over: string[]; text: string; tone?: 'info' | 'warn' | 'ok' | 'err'}
  | {kind: 'frame'; label: string; cond: string; over?: [string, string]}
  | {kind: 'else'; cond: string}
  | {kind: 'end'};

export interface SeqSpec {
  id: string;
  title: string;
  brand?: string; // sur-titre (nom du produit / projet), masqué si absent
  subtitle?: string;
  tag?: string;
  source?: string;
  participants: Participant[];
  items: SeqItem[];
  rowH?: number;
  top?: number;
  left?: number;
  right?: number;
  stepFrames?: number;
  hold?: number;
  captions?: {step: number; text: string}[];
  side?: {x: number; y: number; w: number; title: string; lines: string[]};
}

const isStep = (it: SeqItem) => it.kind === 'msg' || it.kind === 'self' || it.kind === 'note';

export const sequenceDuration = (s: SeqSpec) => {
  const n = s.items.filter(isStep).length;
  return T0 + 30 + n * (s.stepFrames ?? 26) + (s.hold ?? 150);
};

const TONES = {
  info: {bg: '#EAF3FB', border: C.blue},
  warn: {bg: '#FFF4E0', border: C.orange},
  ok: {bg: '#EDF7E8', border: C.ok},
  err: {bg: '#FDECEA', border: C.err},
};

interface Placed {
  it: SeqItem;
  y: number;
  h: number;
  step: number; // index d'étape (pour les éléments animés)
}

export const Sequence: React.FC<{spec: SeqSpec; still?: boolean}> = ({spec, still = false}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const sf = spec.stepFrames ?? 26;
  const left = spec.left ?? 150;
  const right = spec.right ?? width - 150;
  const n = spec.participants.length;
  const xs: Record<string, number> = {};
  spec.participants.forEach((p, i) => (xs[p.id] = n === 1 ? (left + right) / 2 : left + ((right - left) * i) / (n - 1)));
  const rowH = spec.rowH ?? 50;
  const top = spec.top ?? 300;

  // placement vertical
  const placed: Placed[] = [];
  let y = top;
  let step = 0;
  for (const it of spec.items) {
    let h = rowH;
    if (it.kind === 'frame') h = 34;
    else if (it.kind === 'else') h = 34;
    else if (it.kind === 'end') h = 14;
    else if (it.kind === 'self') h = rowH + 14;
    else if (it.kind === 'note') h = 22 + 20 * it.text.split('\n').length;
    placed.push({it, y, h, step: isStep(it) ? step : step});
    if (isStep(it)) step++;
    y += h;
  }
  const bottom = y + 10;
  const startOf = (s: number) => T0 + 30 + s * sf;
  const appear = (s: number, len = 14) =>
    still ? 1 : interpolate(frame, [startOf(s), startOf(s) + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // cadres alt / loop : appariement début / sinon / fin
  const frames: {start: Placed; elses: Placed[]; end: Placed}[] = [];
  const stack: {start: Placed; elses: Placed[]}[] = [];
  for (const p of placed) {
    if (p.it.kind === 'frame') stack.push({start: p, elses: []});
    else if (p.it.kind === 'else') stack[stack.length - 1].elses.push(p);
    else if (p.it.kind === 'end') {
      const f = stack.pop()!;
      frames.push({...f, end: p});
    }
  }

  const headA = still ? 1 : interpolate(frame, [8, 28], [0, 1], {extrapolateRight: 'clamp'});
  const current = placed.filter((p) => isStep(p.it) && frame >= startOf(p.step)).pop();

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT}}>
      <Header title={spec.title} subtitle={spec.subtitle} tag={spec.tag} brand={spec.brand} still={still} />

      {/* bandeau de la ligne en cours */}
      {!still && current ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            top: current.y - 4,
            height: current.h,
            background: '#FFF6E6',
            borderRadius: 6,
          }}
        />
      ) : null}

      {/* cadres */}
      {frames.map((f, i) => {
        const firstStep = placed.find((p) => p.y > f.start.y && isStep(p.it))?.step ?? 0;
        const a = appear(firstStep);
        const it = f.start.it as Extract<SeqItem, {kind: 'frame'}>;
        const x1 = it.over ? xs[it.over[0]] - 120 : left - 110;
        const x2 = it.over ? xs[it.over[1]] + 120 : right + 110;
        return (
          <div key={i} style={{opacity: a}}>
            <div
              style={{
                position: 'absolute',
                left: x1,
                top: f.start.y,
                width: x2 - x1,
                height: f.end.y + f.end.h - f.start.y - 4,
                border: `1.5px solid ${C.faint}`,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x1,
                top: f.start.y,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{background: C.ink, color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderBottomRightRadius: 8}}>
                {it.label}
              </div>
              <div style={{fontSize: 14, fontWeight: 600, color: C.muted, marginLeft: 10}}>[{it.cond}]</div>
            </div>
            {f.elses.map((e, j) => (
              <div key={j}>
                <div
                  style={{
                    position: 'absolute',
                    left: x1,
                    width: x2 - x1,
                    top: e.y + 4,
                    borderTop: `1.5px dashed ${C.faint}`,
                  }}
                />
                <div style={{position: 'absolute', left: x1 + 12, top: e.y + 8, fontSize: 14, fontWeight: 600, color: C.muted}}>
                  [{(e.it as Extract<SeqItem, {kind: 'else'}>).cond}]
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* lignes de vie */}
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
        <GlowDefs />
        {spec.participants.map((p) => (
          <line
            key={p.id}
            x1={xs[p.id]}
            x2={xs[p.id]}
            y1={265}
            y2={265 + (bottom - 265) * headA}
            stroke="#AAB7B8"
            strokeWidth={1.6}
            strokeDasharray="6 6"
          />
        ))}
        {placed.map((p, i) => {
          const it = p.it;
          if (it.kind === 'msg') {
            const x1 = xs[it.from];
            const x2 = xs[it.to];
            const yy = p.y + p.h - 14;
            const s = startOf(p.step);
            const t = still
              ? 1
              : interpolate(frame, [s, s + 16], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.cubic),
                });
            if (t <= 0) return null;
            const color = it.color ?? (it.reply ? C.muted : C.ink);
            const xe = x1 + (x2 - x1) * t;
            const dir = Math.sign(x2 - x1);
            return (
              <g key={i}>
                <line x1={x1} y1={yy} x2={xe} y2={yy} stroke={color} strokeWidth={2.2} strokeDasharray={it.reply ? '7 5' : undefined} />
                <polygon points={`${xe},${yy} ${xe - dir * 12},${yy - 6} ${xe - dir * 12},${yy + 6}`} fill={color} />
                {!still && t < 1 ? <circle cx={xe} cy={yy} r={7} fill={C.orange} filter="url(#glow)" /> : null}
              </g>
            );
          }
          if (it.kind === 'self') {
            const x = xs[it.on];
            const y0 = p.y + 14;
            const y1 = p.y + p.h - 12;
            const a = appear(p.step, 16);
            if (a <= 0) return null;
            const color = it.color ?? C.ink;
            return (
              <g key={i} opacity={a}>
                <path d={`M ${x} ${y0} H ${x + 44} V ${y1} H ${x + 6}`} fill="none" stroke={color} strokeWidth={2.2} />
                <polygon points={`${x + 4},${y1} ${x + 16},${y1 - 6} ${x + 16},${y1 + 6}`} fill={color} />
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* libellés des messages, notes */}
      {placed.map((p, i) => {
        const it = p.it;
        if (it.kind === 'msg') {
          const x1 = xs[it.from];
          const x2 = xs[it.to];
          const a = appear(p.step, 14);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: Math.min(x1, x2),
                width: Math.abs(x2 - x1),
                top: p.y + p.h - 40,
                textAlign: 'center',
                opacity: a,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {it.num !== undefined ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: C.ink,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 0 2px ${C.orange}`,
                    flex: 'none',
                  }}
                >
                  {it.num}
                </div>
              ) : null}
              <div
                style={{
                  flex: 'none',
                  fontSize: 15,
                  fontWeight: it.reply ? 500 : 600,
                  color: it.reply ? C.muted : it.color ?? C.text,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                  fontFamily: it.label.startsWith('GET') || it.label.startsWith('POST') || it.label.startsWith('PATCH') ? 'ui-monospace, "DejaVu Sans Mono", monospace' : FONT,
                }}
              >
                {it.label}
              </div>
            </div>
          );
        }
        if (it.kind === 'self') {
          const a = appear(p.step, 14);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: xs[it.on] + 54,
                top: p.y + 12,
                fontSize: 14.5,
                fontWeight: 500,
                color: it.color ?? C.text,
                opacity: a,
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              {it.num !== undefined ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: C.ink,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 0 2px ${C.orange}`,
                    flex: 'none',
                  }}
                >
                  {it.num}
                </div>
              ) : null}
              <div style={{whiteSpace: 'pre', background: 'rgba(255,255,255,0.92)', padding: '0 4px'}}>{it.label}</div>
            </div>
          );
        }
        if (it.kind === 'note') {
          const a = appear(p.step, 14);
          const t = TONES[it.tone ?? 'warn'];
          const xa = xs[it.over[0]];
          const xb = xs[it.over[it.over.length - 1]];
          const pad = xa === xb ? 165 : 110;
          const x1 = Math.min(xa, xb) - pad;
          const x2 = Math.max(xa, xb) + pad;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x1,
                width: x2 - x1,
                top: p.y + 4,
                height: p.h - 10,
                boxSizing: 'border-box',
                background: t.bg,
                border: `1.5px solid ${t.border}`,
                borderRadius: 4,
                fontSize: 14,
                color: C.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                whiteSpace: 'pre-line',
                lineHeight: 1.35,
                opacity: a,
                transform: `scale(${0.96 + 0.04 * a})`,
              }}
            >
              {it.text}
            </div>
          );
        }
        return null;
      })}

      {/* participants */}
      {spec.participants.map((p, i) => {
        const a = still ? 1 : interpolate(frame, [4 + i * 4, 20 + i * 4], [0, 1], {extrapolateRight: 'clamp'});
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: xs[p.id] - 120,
              top: 160,
              width: 240,
              textAlign: 'center',
              opacity: a,
              transform: `translateY(${(1 - a) * -10}px)`,
            }}
          >
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <div style={{boxShadow: '0 2px 6px rgba(0,0,0,0.15)'}}>
                <Icon name={p.icon} size={50} />
              </div>
            </div>
            <div style={{fontSize: 17, fontWeight: 800, color: C.ink, marginTop: 6}}>{p.title}</div>
            {p.tech ? <div style={{fontSize: 12.5, color: C.muted}}>{p.tech}</div> : null}
          </div>
        );
      })}

      {spec.side ? (
        <div
          style={{
            position: 'absolute',
            left: spec.side.x,
            top: spec.side.y,
            width: spec.side.w,
            background: C.panel,
            borderLeft: `4px solid ${C.orange}`,
            padding: '10px 14px',
            borderRadius: 4,
            opacity: headA,
          }}
        >
          <div style={{fontSize: 14, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: 0.6}}>
            {spec.side.title}
          </div>
          {spec.side.lines.map((l, i) => (
            <div key={i} style={{fontSize: 13.5, color: C.text, marginTop: 5, lineHeight: 1.35}}>
              {l}
            </div>
          ))}
        </div>
      ) : null}

      <Footer source={spec.source} />
      <Captions captions={spec.captions?.map((c) => ({step: (c.step * sf + 30) / sf, text: c.text}))} sf={sf} still={still} />
    </AbsoluteFill>
  );
};
