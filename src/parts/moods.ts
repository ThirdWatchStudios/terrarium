import type { Facing, Mood, ShapeSpec } from '../core/types';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * Mood face overlays — eyebrows and mouths drawn over the head (anchor:
 * headCenter, head radius 21, eyes at (±8, 0) south / (11, 0) east). North has
 * no face, so moods render nothing from behind; the mood sheet still emits the
 * frame so engine-side indexing stays uniform.
 *
 * All shapes are style-neutral detail strokes (silhouette: false) in the same
 * ink as the eyes, so they survive palette and outline changes untouched.
 */

const INK = UI_PALETTE.ink;

const brow = (d: string): ShapeSpec => ({ d, stroke: INK, strokeWidth: 2, silhouette: false });
const mouth = (d: string): ShapeSpec => ({ d, stroke: INK, strokeWidth: 2, silhouette: false });

export const MOOD_OVERLAYS: Record<Mood, Partial<Record<Facing, ShapeSpec[]>>> = {
  // Eyes-only neutral face, RimWorld-style. The `none` short-term state.
  normal: {},

  // Anxious — worry: inner brows pulled up-and-together, a small tense mouth.
  anxious: {
    south: [
      brow('M -12 -4 L -4 -8'),
      brow('M 4 -8 L 12 -4'),
      mouth('M -4 12 Q 0 13.5 4 12'),
    ],
    east: [brow('M 5 -4 L 15 -8'), mouth('M 11 12 Q 14 13.5 17 12')],
  },

  // Slighted — offended/put-out: flat brows pressed low, a downturned pout.
  slighted: {
    south: [
      brow('M -12 -6 L -4 -6'),
      brow('M 4 -6 L 12 -6'),
      mouth('M -5 13 Q 0 11 5 13'),
    ],
    east: [brow('M 6 -6 L 15 -6'), mouth('M 11 13 Q 14 11 17 13')],
  },

  // Confident — self-assured: smooth gently-arched brows, an easy open smile.
  confident: {
    south: [
      brow('M -12 -6 Q -8 -8 -4 -7'),
      brow('M 4 -7 Q 8 -8 12 -6'),
      mouth('M -5 11 Q 0 14 5 11'),
    ],
    east: [brow('M 6 -7 Q 10 -8 15 -6'), mouth('M 11 11 Q 14 14 17 11')],
  },

  // Defensive — guarded/braced: brows slanted up-and-out, a short pressed mouth.
  defensive: {
    south: [
      brow('M -12 -8 L -4 -5'),
      brow('M 4 -5 L 12 -8'),
      mouth('M -3 11 L 3 11'),
    ],
    east: [brow('M 6 -5 L 15 -8'), mouth('M 12 11 L 17 11')],
  },

  // Reassured — comforted/calm: soft near-flat brows, a small gentle smile.
  reassured: {
    south: [
      brow('M -12 -6 L -4 -6.5'),
      brow('M 4 -6.5 L 12 -6'),
      mouth('M -4 12 Q 0 14 4 12'),
    ],
    east: [brow('M 6 -6 L 15 -6.5'), mouth('M 11 12 Q 14 14 17 12')],
  },
};

/**
 * Overhead emote badges — a large, color-coded symbol that floats above the
 * head. Where the face overlays carry expression at hero scale, the badge
 * carries readability at scene scale: it is facing-independent (drawn the same
 * from every angle, including north, where there is no face) and rendered
 * undistorted above all parts. `normal` has no badge so idle crowds stay clean.
 *
 * Glyphs are white strokes/fills sitting on the mood-colored bubble; the bubble
 * is ringed in the same style-neutral ink as the faces, so badges survive
 * palette and outline changes untouched. Coordinates are badge-local: (0,0) is
 * the bubble center, usable box roughly ±6.
 */
export interface MoodEmote {
  /** Bubble fill — a literal mood color, not a palette token. */
  color: string;
  /** Symbol drawn on the bubble, in badge-local coords. */
  glyph: ShapeSpec[];
}

const GLYPH = UI_PALETTE.onColor;
const gStroke = (d: string): ShapeSpec => ({ d, stroke: GLYPH, strokeWidth: 1.8, silhouette: false });
const gFill = (d: string): ShapeSpec => ({ d, fill: GLYPH, silhouette: false });
const gDot = (cx: number, cy: number): ShapeSpec =>
  gFill(`M ${cx - 1.1} ${cy} a 1.1 1.1 0 1 0 2.2 0 a 1.1 1.1 0 1 0 -2.2 0 Z`);

export const MOOD_EMOTES: Record<Mood, MoodEmote | null> = {
  normal: null,

  // Sweat drop — the nervous bead. Bubble rides the negative (rose) valence.
  anxious: {
    color: UI_PALETTE.emote.moodAnxious,
    glyph: [gFill('M 0 -4.6 Q 3 0.6 0 3.6 Q -3 0.6 0 -4.6 Z')],
  },

  // Downturned pout — the offended frown.
  slighted: {
    color: UI_PALETTE.emote.moodSlighted,
    glyph: [gStroke('M -4 1.6 Q 0 -2 4 1.6'), gDot(-3, -3), gDot(3, -3)],
  },

  // Upward check — assured, affirmed. Bubble rides the positive (teal) valence.
  confident: {
    color: UI_PALETTE.emote.moodConfident,
    glyph: [gStroke('M -3.6 0 L -1 2.8 L 4 -3.2')],
  },

  // Exclamation mark — guard up.
  defensive: {
    color: UI_PALETTE.emote.moodDefensive,
    glyph: [gStroke('M 0 -5.2 L 0 1.6'), gDot(0, 4.2)],
  },

  // Gentle smile — calmed, comforted.
  reassured: {
    color: UI_PALETTE.emote.moodReassured,
    glyph: [gStroke('M -4 -1 Q 0 2.6 4 -1'), gDot(-3, -3), gDot(3, -3)],
  },
};
