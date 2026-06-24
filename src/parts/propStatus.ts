import type { ShapeSpec } from '../core/types';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * Prop-status badges — overhead status emotes that float above a *tampered*
 * interaction prop (printer / coffee machine / water cooler), the prop sibling
 * of the agent activity badges in activities.ts. When the player jams, breaks,
 * or empties a prop, the sim swaps the prop sprite to its broken variant AND
 * blits the matching badge above it so the tamper reads from across the office,
 * not just up close.
 *
 * Like the activity badges, this is a single SHARED, prop-independent atlas the
 * sim selects from at runtime, keyed off the prop's active tamper-state id. The
 * ids here MUST match the sim's CoercionProductionRuntime tamper-state ids
 * (jammed / broken / out_of_service); an unknown id draws nothing.
 *
 * Design: every status shares the same high-visibility alert-red bubble so the
 * "something's wrong" signal reads first and uniformly; the glyph then says
 * which fault it is. Badge-local coords: (0,0) is the bubble center, box ~±6.
 */

/** Prop tamper states with a badge. Mirrors the sim's degraded tamper-state ids. */
export type PropStatus = 'jammed' | 'broken' | 'out_of_service';

/** Canonical order. Also the set of cells emitted into the shared atlas. */
export const PROP_STATUSES: PropStatus[] = ['jammed', 'broken', 'out_of_service'];

export interface PropStatusBadge {
  /** Bubble fill — the shared alert color for every status (see module note). */
  color: string;
  /** Symbol drawn on the bubble, in badge-local coords. */
  glyph: ShapeSpec[];
}

const GLYPH = UI_PALETTE.onColor;
// One alert hue for every tamper state, so the bubble itself signals "fault".
const ALERT = UI_PALETTE.status.danger;
const gStroke = (d: string): ShapeSpec => ({ d, stroke: GLYPH, strokeWidth: 1.8, silhouette: false });
const gThin = (d: string): ShapeSpec => ({ d, stroke: GLYPH, strokeWidth: 1.3, silhouette: false });

/**
 * tamper-state id → badge. Distinct bold glyphs, all on the alert bubble: a
 * jammed sheet, a cracked cup, an emptied drop. Keep them legible at badge
 * scale — single symbols, no fine detail.
 */
export const PROP_STATUS_BADGES: Record<PropStatus, PropStatusBadge> = {
  // Printer jam — a sheet with a crumpled crease torn across it.
  jammed: {
    color: ALERT,
    glyph: [
      gStroke('M -3.4 -4.2 L 3.4 -4.2 L 3.4 4.2 L -3.4 4.2 Z'),
      gStroke('M -3.4 0.2 L -1 -1.4 L 1 0.8 L 3.4 -0.9'),
    ],
  },

  // Coffee machine broken — a mug with a lightning crack down its side.
  broken: {
    color: ALERT,
    glyph: [
      gStroke('M -3.4 -1.6 H 2.6 V 1 Q 2.6 3.4 -0.4 3.4 Q -3.4 3.4 -3.4 1 Z'),
      gStroke('M 2.6 -0.8 Q 4.6 -0.8 4.6 0.6 Q 4.6 1.8 3 1.8'),
      gThin('M -0.8 -1.6 L 0.2 0 L -0.7 0.8 L 0.3 2.4'),
    ],
  },

  // Water cooler out of service — a drained drop struck through (no water).
  out_of_service: {
    color: ALERT,
    glyph: [
      gStroke('M 0 -4.6 Q 3 -0.8 3 1.2 Q 3 4 0 4 Q -3 4 -3 1.2 Q -3 -0.8 0 -4.6 Z'),
      { d: 'M -4.4 4.4 L 4.4 -4.4', stroke: GLYPH, strokeWidth: 2, silhouette: false },
    ],
  },
};
