import type { IconDef } from './icons';
import type { ShapeSpec } from '../core/types';
import { circle } from '../core/geometry';

/**
 * Emotion glyphs — the harvest loop's full vocabulary made visible
 * (docs/icon-expansion-plan.md §3.B). 14 ambient need-derived emotions + 3
 * acute event spikes, grounded in The-Water-Cooler's
 * core-loop-emotion-harvesting.md. This is a DIFFERENT vocabulary from the 5
 * mood emotes (dispositions); emotions are the harvestable substance.
 *
 * One authored geometry, two emissions:
 *   - Chrome: each glyph registers as a tintable `emotion-<id>` icon (white
 *     mask; inspector / capture UI recolors via `--wc-*`), spread into ICONS.
 *   - Floor: a shared `emotion-glyphs` atlas — the same marks drawn ink-on-halo
 *     (cursor treatment: dark ink over a light contrast halo) so the bare glyph
 *     reads inside the Shapes-drawn acute-spike outline on any floor. Color
 *     stays OUT of the cell — the surrounding outline carries the emotion's
 *     hue, so the look stays tweakable post-build.
 *
 * Style grammar (§5 decision 4, resolved 2026-07-01): glyphs share a BASE FORM
 * per group and differ by one differentiator, so 17 marks stay distinguishable
 * at ~24px by silhouette family first, member second:
 *   hostile     → the JAG (zigzag energy: erupting / bottled / blocked / barbed)
 *   covetous    → the GAZE (an eye and the coveted thing)
 *   fear        → TREMOR & WEIGHT (over a small self-dot)
 *   deprivation → EMPTINESS (the absent thing)
 *   expansive   → the RISE (ascent forms)
 *   acute       → the BURST (radiating event energy)
 *
 * Authoring rule matches icons.ts: local coords centered on (0,0), legible at
 * ~24px, heavy strokes (~6–9u on the 128u canvas), generous negative space.
 */

export type EmotionTier = 'ambient' | 'acute';
export type EmotionGroup = 'hostile' | 'covetous' | 'fear' | 'deprivation' | 'expansive' | 'acute';

/** A single mark: neutral geometry both emissions render (mask vs ink-on-halo). */
export interface EmotionMark {
  d: string;
  kind: 'stroke' | 'fill';
  /** Stroke width (stroke marks only). */
  w?: number;
}

export interface EmotionDef {
  /** Sim-facing emotion id (the harvest vocabulary word, lowercase). */
  id: string;
  label: string;
  tier: EmotionTier;
  group: EmotionGroup;
  marks: EmotionMark[];
}

const s = (d: string, w = 7): EmotionMark => ({ d, kind: 'stroke', w });
const f = (d: string): EmotionMark => ({ d, kind: 'fill' });

/** Canonical order: the 14 ambient emotions (doc order), then the 3 acute spikes. */
export const EMOTION_DEFS: EmotionDef[] = [
  // --- hostile: the JAG -------------------------------------------------------
  {
    id: 'resentment',
    label: 'Resentment',
    tier: 'ambient',
    group: 'hostile',
    // The bottled jag — a grudge held in a vessel, still poking above the rim.
    marks: [s('M -20 -8 L -20 12 Q -20 26 0 26 Q 20 26 20 12 L 20 -8', 7), s('M -6 -26 L 4 -10 L -4 -2 L 6 12', 7)],
  },
  {
    id: 'frustration',
    label: 'Frustration',
    tier: 'ambient',
    group: 'hostile',
    // The blocked jag — energy ramming a wall that won't move.
    marks: [s('M 18 -26 L 18 26', 9), s('M -28 -12 L -8 -2 L -20 8 L 8 16', 8), s('M 25 -12 L 30 -16', 5), s('M 25 4 L 30 8', 5)],
  },
  {
    id: 'anger',
    label: 'Anger',
    tier: 'ambient',
    group: 'hostile',
    // The erupting jag — rising strike with burst ticks at the tip.
    marks: [s('M -6 26 L 6 6 L -4 -2 L 8 -22', 9), s('M 2 -30 L -2 -38', 6), s('M 14 -28 L 20 -34', 6)],
  },
  {
    id: 'spite',
    label: 'Spite',
    tier: 'ambient',
    group: 'hostile',
    // The barbed jag — the strike that curls back for payback.
    marks: [s('M -10 -26 L 2 -8 L -8 2 L 6 18', 8), s('M 6 18 Q 18 26 24 12', 8), f('M 26 14 L 16 6 L 30 1 Z')],
  },

  // --- covetous: the GAZE -----------------------------------------------------
  {
    id: 'jealousy',
    label: 'Jealousy',
    tier: 'ambient',
    group: 'covetous',
    // Watching while clutching your own gem — fear of losing what you hold.
    marks: [
      s('M -16 -14 Q 0 -24 16 -14 Q 0 -4 -16 -14 Z', 6),
      f(circle(0, -14, 4)),
      f('M 0 6 L 9 15 L 0 24 L -9 15 Z'),
      s('M -16 27 Q 0 35 16 27', 6),
    ],
  },
  {
    id: 'envy',
    label: 'Envy',
    tier: 'ambient',
    group: 'covetous',
    // The gaze fixed on ANOTHER'S gem — hollow, out of reach.
    marks: [
      s('M -28 10 Q -12 0 4 10 Q -12 20 -28 10 Z', 6),
      f(circle(-12, 10, 4)),
      s('M 18 -20 L 27 -11 L 18 -2 L 9 -11 Z', 6),
    ],
  },

  // --- fear: TREMOR & WEIGHT --------------------------------------------------
  {
    id: 'anxiety',
    label: 'Anxiety',
    tier: 'ambient',
    group: 'fear',
    // Tremor lines (icon-scale echo of the anxious social-state badge).
    marks: [
      s('M -26 -6 Q -19.5 -18 -13 -6 Q -6.5 6 0 -6 Q 6.5 -18 13 -6 Q 19.5 6 26 -6', 7),
      s('M -18 14 Q -12 4 -6 14 Q 0 24 6 14 Q 12 4 18 14', 5),
    ],
  },
  {
    id: 'fear',
    label: 'Fear',
    tier: 'ambient',
    group: 'fear',
    // The looming wedge over the small cowering self.
    marks: [f('M -20 -30 L 20 -30 L 0 2 Z'), f(circle(0, 22, 6))],
  },
  {
    id: 'insecurity',
    label: 'Insecurity',
    tier: 'ambient',
    group: 'fear',
    // Ground giving way — a broken circle around an off-center self.
    marks: [s('M 4 -21.6 A 22 22 0 0 1 21 6', 7), s('M -8 20.5 A 22 22 0 0 1 -21.8 -3', 7), f(circle(4, 5, 6))],
  },
  {
    id: 'overwhelm',
    label: 'Overwhelm',
    tier: 'ambient',
    group: 'fear',
    // Stacked weight pressing the self flat.
    marks: [
      s('M -20 -24 L 20 -24', 8),
      s('M -16 -12 L 16 -12', 8),
      s('M -12 0 L 12 0', 8),
      f('M -9 16 A 9 6 0 1 0 9 16 A 9 6 0 1 0 -9 16 Z'),
    ],
  },

  // --- deprivation: EMPTINESS -------------------------------------------------
  {
    id: 'loneliness',
    label: 'Loneliness',
    tier: 'ambient',
    group: 'deprivation',
    // The group's empty ring, and you outside it.
    marks: [s(circle(8, -8, 14), 6), f(circle(-18, 18, 6))],
  },
  {
    id: 'boredom',
    label: 'Boredom',
    tier: 'ambient',
    group: 'deprivation',
    // The flatline that sags — time going nowhere.
    marks: [s('M -26 -6 L -6 -6 Q 2 -6 6 2 Q 9 8 14 8 L 26 8', 7)],
  },

  // --- expansive: the RISE ----------------------------------------------------
  {
    id: 'ambition',
    label: 'Ambition',
    tier: 'ambient',
    group: 'expansive',
    // Steps climbed, arrow still pointing up.
    marks: [
      s('M -26 22 L -10 22 L -10 6 L 6 6 L 6 -10 L 22 -10', 8),
      s('M 22 -10 L 22 -24', 8),
      f('M 22 -32 L 15 -21 L 29 -21 Z'),
    ],
  },
  {
    id: 'pride',
    label: 'Pride',
    tier: 'ambient',
    group: 'expansive',
    // The crest — plumes fanned up from a puffed chest.
    marks: [
      s('M -18 26 Q 0 14 18 26', 7),
      s('M 0 16 L 0 -12', 7),
      s('M -10 18 L -20 -4', 7),
      s('M 10 18 L 20 -4', 7),
      f(circle(0, -16, 4)),
      f(circle(-22, -8, 3.5)),
      f(circle(22, -8, 3.5)),
    ],
  },

  // --- acute spikes: the BURST ------------------------------------------------
  {
    id: 'embarrassment',
    label: 'Embarrassment',
    tier: 'acute',
    group: 'acute',
    // The flagship spike — a bowed head under radiating flush heat.
    marks: [
      s('M -18 20 Q 0 -4 18 20', 7),
      s('M -14 -10 L -20 -20', 5),
      s('M 0 -12 L 0 -24', 5),
      s('M 14 -10 L 20 -20', 5),
    ],
  },
  {
    id: 'vindication',
    label: 'Vindication',
    tier: 'acute',
    group: 'acute',
    // The check that bursts — proven right, with rays (no ring: this is an
    // event, not the directive-target-met status).
    marks: [s('M -18 4 L -6 16 L 20 -12', 9), s('M 24 -20 L 30 -26', 6), s('M 10 -22 L 12 -30', 6)],
  },
  {
    id: 'relief',
    label: 'Relief',
    tier: 'acute',
    group: 'acute',
    // The exhale — a tense wave settling to flat, the self at rest below.
    marks: [s('M -26 -14 Q -14 -26 -4 -10 Q 2 0 12 2 L 26 2', 7), f(circle(18, 14, 4.5))],
  },
];

/** Canonical id order — also the atlas cell order. */
export const EMOTIONS: string[] = EMOTION_DEFS.map((e) => e.id);

const BY_ID: Record<string, EmotionDef> = Object.fromEntries(EMOTION_DEFS.map((e) => [e.id, e]));

/** Lookup by emotion id, or undefined for unknown (caller draws nothing). */
export function getEmotion(id: string): EmotionDef | undefined {
  return BY_ID[id];
}

const ACC = '$accent'; // marker only — emitted as a white mask, recolored by the framework
function markToMask(m: EmotionMark): ShapeSpec {
  return m.kind === 'stroke' ? { d: m.d, stroke: ACC, strokeWidth: m.w ?? 7, silhouette: false } : { d: m.d, fill: ACC, silhouette: false };
}

/** The chrome emission: every emotion as a tintable `emotion-<id>` icon. */
export const EMOTION_ICONS: IconDef[] = EMOTION_DEFS.map((e) => ({
  id: `emotion-${e.id}`,
  label: e.label,
  mode: 'tintable',
  shapes: e.marks.map(markToMask),
}));
