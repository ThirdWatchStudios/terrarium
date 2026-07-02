import type { ShapeSpec } from '../core/types';
import { circle } from '../core/geometry';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * Social-state badges — overhead status emotes for an agent's SHORT-TERM social
 * state (anxious, slighted, confident...), the third sibling in the overhead
 * family beside mood emotes (moods.ts) and activity badges (activities.ts).
 * Where a mood is a disposition and an activity is what the body is doing, a
 * social state is the transient interpersonal weather left by recent encounters
 * — visible today only as inspector text; this atlas makes it legible from the
 * floor (docs/icon-expansion-plan.md §3.D).
 *
 * Like the other overhead families this is a single SHARED, character-independent
 * atlas the sim blits at the aboveHead anchor, keyed off the sim's short-term
 * social-state id (mirrors ShortTermSocialStateLabel). Unknown ids draw nothing
 * (free-text-with-fallback, per CONTRACT.md).
 *
 * Design: the bubble color encodes VALENCE (negative states ride the emotion
 * rose, positive states the trust teal-blue — the same semantic channels the
 * emotion-spike puff and trust line already own); the glyph says which state.
 * Badge-local coords: (0,0) is the bubble center, usable box roughly ±6.
 */

/** Short-term social states with a badge. Mirrors the sim's ShortTermSocialStateLabel ids. */
export type SocialState = 'anxious' | 'slighted' | 'confident' | 'defensive' | 'reassured';

/** Canonical order. Also the set of cells emitted into the shared atlas. */
export const SOCIAL_STATES: SocialState[] = ['anxious', 'slighted', 'confident', 'defensive', 'reassured'];

export interface SocialStateBadge {
  /** Bubble fill — the valence hue (see module note), not a per-state color. */
  color: string;
  /** Symbol drawn on the bubble, in badge-local coords. */
  glyph: ShapeSpec[];
}

const GLYPH = UI_PALETTE.onColor;
const gStroke = (d: string): ShapeSpec => ({ d, stroke: GLYPH, strokeWidth: 1.8, silhouette: false });
const gThin = (d: string): ShapeSpec => ({ d, stroke: GLYPH, strokeWidth: 1.3, silhouette: false });
const gFill = (d: string): ShapeSpec => ({ d, fill: GLYPH, silhouette: false });

/**
 * social-state id → badge. Bold single symbols, no fine detail, legible at badge
 * scale; negative and positive states must also differ by GLYPH shape (not just
 * bubble hue) so the pair triages color-blind.
 */
export const SOCIAL_STATE_BADGES: Record<SocialState, SocialStateBadge> = {
  // Tremor lines — nerves you can see shaking.
  anxious: {
    color: UI_PALETTE.socialState.anxious,
    glyph: [
      gStroke('M -4.4 -0.8 Q -3.3 -2.8 -2.2 -0.8 Q -1.1 1.2 0 -0.8 Q 1.1 -2.8 2.2 -0.8 Q 3.3 1.2 4.4 -0.8'),
      gThin('M -3 2.8 Q -2 1.2 -1 2.8 Q 0 4.4 1 2.8 Q 2 1.2 3 2.8'),
    ],
  },

  // Pressed down — a chevron bearing on a lone dot (the put-down, seen from outside).
  slighted: {
    color: UI_PALETTE.socialState.slighted,
    glyph: [gStroke('M -3.8 -3.2 L 0 0.4 L 3.8 -3.2'), gFill(circle(0, 3.4, 1.4))],
  },

  // Double ascent — chest-out confidence (badge-scale echo of pressure-confidence).
  confident: {
    color: UI_PALETTE.socialState.confident,
    glyph: [gStroke('M -3.8 -0.4 L 0 -4 L 3.8 -0.4'), gStroke('M -3.8 4 L 0 0.4 L 3.8 4')],
  },

  // Shield up — guarding, not attacking.
  defensive: {
    color: UI_PALETTE.socialState.defensive,
    glyph: [gStroke('M 0 -4.4 L 4 -3 L 4 0.4 Q 4 3.2 0 4.6 Q -4 3.2 -4 0.4 L -4 -3 Z')],
  },

  // Sheltered — a settled dot under a covering arc; the tension released.
  reassured: {
    color: UI_PALETTE.socialState.reassured,
    glyph: [gStroke('M -4 1 Q -4 -4 0 -4 Q 4 -4 4 1'), gFill(circle(0, 2.6, 1.6))],
  },
};
