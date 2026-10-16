import React from 'react';
import {DiagramSpec, diagramDuration} from './Diagram';
import {SeqSpec, sequenceDuration} from './Sequence';

// Une entrée = une composition Remotion (un PNG + un MP4 au rendu).
export interface Entry {
  id: string;
  spec?: DiagramSpec;
  seq?: SeqSpec;
  component?: React.FC<{still?: boolean}>;
  duration?: number;
}

/** Schéma d'architecture (boîtes, groupes, flèches animées). */
export const diagram = (spec: DiagramSpec): Entry => ({id: spec.id, spec});
/** Diagramme de séquence (participants, messages, cadres alt/par). */
export const sequence = (seq: SeqSpec): Entry => ({id: seq.id, seq});
/** Composant React libre ; `still` = true pour l'image fixe. Durée en frames. */
export const custom = (id: string, component: React.FC<{still?: boolean}>, duration: number): Entry => ({
  id,
  component,
  duration,
});

export const durationOf = (e: Entry) =>
  e.duration ?? (e.spec ? diagramDuration(e.spec) : e.seq ? sequenceDuration(e.seq) : 300);
