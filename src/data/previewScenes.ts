import type { Facing } from '../core/types';
import type { Pose } from '../parts/poses';
import type { Provenance } from '../core/registry';

/**
 * Canned beat scripts for the Language › Reading Test harness — NON-NORMATIVE
 * fixtures, never exported (CONTRACT §3.16: sequencing is the sim Director's;
 * these exist so the tool can answer "does the grammar read?" without booting
 * Unity, and they double as the presentation experiment's Build A/B rig,
 * docs/social-theater-presentation-experiment.md).
 *
 * Two decks, two owners — deliberately mirroring the architecture:
 *   - `beats` drive BODIES (the performance layer: pose · orientation · hold ·
 *     move). The renderer only ever shows the held pose named; nothing between
 *     beats is drawn (walk beats lerp position — `move` is legal, tweening
 *     poses is not).
 *   - `effects` drive REGISTER SYMBOLS (register-constitution.md): truth-layer
 *     glyphs the body earns, IRIS-layer claims the corporation projects. The
 *     two may disagree — that disagreement is the thing this harness exists to
 *     preview (Article VI).
 */

export type SceneActor = 'M' | 'E';

export interface StageMark {
  x: number;
  y: number;
}

export interface SceneBeat {
  /** ms from scene start. */
  t: number;
  actor: SceneActor;
  pose: Pose;
  facing: Facing | 'west';
  /** Walk target — the actor lerps from its current mark across `dur`. */
  moveTo?: StageMark;
  /** ms this beat occupies (dwell or travel). */
  dur: number;
  /** Presence channel(s) that would shape this beat sim-side (display only). */
  presence?: string;
  note: string;
}

export interface SceneEffect {
  from: number;
  until?: number;
  register: 'truth' | 'iris';
  kind: 'emotion' | 'conflict-arc' | 'pressure-halo' | 'puff' | 'claim';
  /** emotion id / puff id / claim text, per kind. */
  value: string;
  /** IRIS claims carry provenance (Article IV.4). */
  provenance?: Provenance;
  /** Which actor the symbol hangs on (arcs span both). */
  actor?: SceneActor;
}

export interface PreviewScene {
  id: string;
  title: string;
  /** What a viewer should recover (the experiment's scoring key). Spoiler. */
  groundTruth: string;
  durationMs: number;
  start: Record<SceneActor, { at: StageMark; facing: Facing | 'west'; pose: Pose }>;
  beats: SceneBeat[];
  effects: SceneEffect[];
}

/**
 * The Appendix A reprimand — the experiment's test scene. Meaning lives in the
 * SEQUENCE (notice → withdrawal → exit), so it forces a transition read.
 * Timing is the Appendix A budget (~7.5 s).
 */
export const REPRIMAND_SCENE: PreviewScene = {
  id: 'reprimand',
  title: 'The reprimand (Appendix A)',
  groundTruth:
    'An authority figure approached a subordinate, confronted them; the subordinate ' +
    'registered it and shrank; the authority left. Detectable transition beats: the ' +
    'notice, the withdrawal, the exit.',
  durationMs: 7450,
  start: {
    M: { at: { x: 70, y: 150 }, facing: 'east', pose: 'neutral' },
    E: { at: { x: 360, y: 150 }, facing: 'east', pose: 'neutral' }, // facing away
  },
  beats: [
    { t: 800, actor: 'M', pose: 'walk-approach', facing: 'east', moveTo: { x: 285, y: 150 }, dur: 1500, presence: 'gaitSpeed', note: 'M approaches — pace of approach' },
    { t: 2100, actor: 'E', pose: 'notice', facing: 'west', dur: 250, presence: 'attentiveness', note: 'E registers — the anticipation beat' },
    { t: 2350, actor: 'M', pose: 'hands-on-hips', facing: 'east', dur: 1000, presence: 'proximityRange', note: 'M plants — how close, how looming' },
    { t: 3350, actor: 'M', pose: 'point', facing: 'east', dur: 900, presence: 'expressiveness', note: 'THE ACCUSATION — key beat' },
    { t: 4250, actor: 'E', pose: 'slump', facing: 'west', moveTo: { x: 395, y: 150 }, dur: 700, presence: 'commitment / latency', note: 'E withdraws — the low-commitment reverse beat lives here' },
    { t: 4950, actor: 'M', pose: 'walk-away', facing: 'west', moveTo: { x: 80, y: 220 }, dur: 1500, presence: 'exit-style', note: 'M exits — clipped vs. lingering' },
    { t: 6450, actor: 'E', pose: 'slump', facing: 'west', dur: 1000, presence: 'restlessness', note: 'E holds the residual slump' },
  ],
  effects: [
    // IRIS notices the friction the moment the accusation lands — measured: an
    // interaction event genuinely happened.
    { from: 3350, until: 4950, register: 'iris', kind: 'conflict-arc', value: 'conflict', provenance: 'measured' },
    { from: 3350, until: 4600, register: 'iris', kind: 'claim', value: 'FRICTION EVENT — CORRECTIVE INTERACTION IN PROGRESS', provenance: 'measured' },
    // The body tells the truth: E is embarrassed.
    { from: 4250, register: 'truth', kind: 'emotion', value: 'embarrassment', actor: 'E' },
    { from: 4250, register: 'iris', kind: 'pressure-halo', value: 'pressure', actor: 'E' },
    // …and IRIS reads the withdrawal as success. Wrong about WHY, in exactly
    // the structured way Article IV licenses. The disagreement is the exhibit.
    { from: 4600, register: 'iris', kind: 'claim', value: 'SUBJECT E — CONFIDENCE RESTORED', provenance: 'inferred' },
    // The corporation's valuation of the aftermath: harvest window open.
    { from: 6450, register: 'iris', kind: 'puff', value: 'attn-harvestable', actor: 'E' },
  ],
};

export const PREVIEW_SCENES: PreviewScene[] = [REPRIMAND_SCENE];
