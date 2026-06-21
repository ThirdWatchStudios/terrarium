import type { ShapeSpec } from '../core/types';
import { circle, rr } from '../core/geometry';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * UI icon set — flat geometric glyphs for the framing UI (docs/ui-art-plan.md).
 * These are NOT world sprites: no facings, no frames, no anchors. Each icon is a
 * single character-independent composition, authored in local coords centered on
 * (0,0) — composeIcon() places it at the canvas center.
 *
 * Two modes (mirrors the token-vs-literal split the layer atlas already uses):
 *   - 'tintable'  → emitted as a WHITE MASK; the framework supplies the color
 *                   (USS `unity-background-image-tint-color` / uGUI `Image.color`).
 *                   Shape fill/stroke COLORS ARE IGNORED here — geometry only.
 *                   Use '$accent' as a marker so intent stays readable.
 *   - 'literal'   → ships final colors (multi-hue diegetic glyphs).
 *
 * Authoring rule: legible at ~24px. Heavy strokes (~8–11u on the 128u canvas),
 * generous negative space, no fine detail. The export ladder downsamples these.
 *
 * The diegetic batches (department / need / relationship) are grounded in the
 * real catalogs: department CATEGORIES (DEFAULT_DEPARTMENTS), the six canonical
 * NEEDS every drive amplifies (DEFAULT_DRIVES.amplifiesNeeds), and relationship
 * CATEGORIES (DEFAULT_RELATIONSHIP_TYPES). They cover the coarse groupings, not
 * every leaf id — reconcile the final set against the UI epic (Epic 36).
 */

export type IconMode = 'tintable' | 'literal';

export interface IconDef {
  /** Stable export key, e.g. 'ui-gear'. Becomes icons/<id>.svg + @Nx.png. */
  id: string;
  label: string;
  mode: IconMode;
  /** Local-coord shapes, centered on (0,0). */
  shapes: ShapeSpec[];
}

/** A cursor: an icon plus a normalized hotspot (the active pixel, 0..1). */
export interface CursorDef extends IconDef {
  hotspot: { x: number; y: number };
}

// --- tintable helpers (color ignored — emitted as a white mask) -------------
const ACC = '$accent'; // marker only; recolored by the framework
const stroke = (d: string, strokeWidth = 9): ShapeSpec => ({ d, stroke: ACC, strokeWidth, silhouette: false });
const fill = (d: string): ShapeSpec => ({ d, fill: ACC, silhouette: false });

// --- literal helpers (final colors shipped) ---------------------------------
const lit = (d: string, color: string): ShapeSpec => ({ d, fill: color, silhouette: false });
const litStroke = (d: string, color: string, strokeWidth = 8): ShapeSpec => ({ d, stroke: color, strokeWidth, silhouette: false });

// Gear teeth — eight thick radial spokes (r 20→37) at 45° steps; round caps read
// as squared teeth. Paired with the hub ring below.
const GEAR_TEETH: ShapeSpec[] = [
  stroke('M 20 0 L 37 0', 10),
  stroke('M 14.1 14.1 L 26.2 26.2', 10),
  stroke('M 0 20 L 0 37', 10),
  stroke('M -14.1 14.1 L -26.2 26.2', 10),
  stroke('M -20 0 L -37 0', 10),
  stroke('M -14.1 -14.1 L -26.2 -26.2', 10),
  stroke('M 0 -20 L 0 -37', 10),
  stroke('M 14.1 -14.1 L 26.2 -26.2', 10),
];

const HEART = 'M 0 26 C -30 4 -22 -22 0 -8 C 22 -22 30 4 0 26 Z';

export const ICONS: IconDef[] = [
  // --- Control glyphs (tintable) --------------------------------------------
  {
    id: 'ui-gear',
    label: 'Settings',
    mode: 'tintable',
    shapes: [stroke(circle(0, 0, 20), 11), ...GEAR_TEETH],
  },
  { id: 'ui-close', label: 'Close', mode: 'tintable', shapes: [stroke('M -28 -28 L 28 28'), stroke('M 28 -28 L -28 28')] },
  { id: 'ui-play', label: 'Play', mode: 'tintable', shapes: [fill('M -22 -30 L 30 0 L -22 30 Z')] },
  {
    id: 'ui-pause',
    label: 'Pause',
    mode: 'tintable',
    shapes: [fill(rr(-28, -30, 14, 60, 5)), fill(rr(14, -30, 14, 60, 5))],
  },
  {
    id: 'ui-save',
    label: 'Save',
    mode: 'tintable',
    shapes: [stroke(rr(-30, -30, 60, 60, 8), 8), fill(rr(-14, 8, 28, 22, 3)), fill(rr(-8, -30, 22, 16, 2))],
  },

  // --- Decorative trim (tintable; animation is the framework's) --------------
  {
    id: 'ui-divider',
    label: 'Divider',
    mode: 'tintable',
    shapes: [stroke('M -36 0 L -10 0', 6), stroke('M 10 0 L 36 0', 6), fill('M 0 -9 L 9 0 L 0 9 L -9 0 Z')],
  },
  {
    id: 'ui-corner',
    label: 'Corner ornament',
    mode: 'tintable',
    shapes: [stroke('M -28 28 L -28 -20 Q -28 -28 -20 -28 L 28 -28', 8)],
  },
  {
    id: 'ui-spinner',
    label: 'Spinner',
    mode: 'tintable',
    // Three-quarter arc; the framework rotates it.
    shapes: [stroke('M 0 -28 A 28 28 0 1 1 -28 0', 9)],
  },

  // --- Department CATEGORY glyphs (tintable) ---------------------------------
  // leadership / finance / commercial / technical / operations / administrative
  { id: 'dept-leadership', label: 'Leadership', mode: 'tintable', shapes: [fill('M -30 12 L -30 -14 L -15 2 L 0 -22 L 15 2 L 30 -14 L 30 12 Z')] },
  {
    id: 'dept-finance',
    label: 'Finance',
    mode: 'tintable',
    shapes: [stroke(circle(0, -10, 18), 8), stroke(circle(0, 2, 18), 8), stroke(circle(0, 14, 18), 8)],
  },
  {
    id: 'dept-commercial',
    label: 'Commercial',
    mode: 'tintable',
    shapes: [fill(rr(-28, 6, 11, 24, 2)), fill(rr(-6, -6, 11, 36, 2)), fill(rr(16, -22, 11, 52, 2))],
  },
  {
    id: 'dept-technical',
    label: 'Technical',
    mode: 'tintable',
    shapes: [stroke('M 0 -26 L 22 -13 L 22 13 L 0 26 L -22 13 L -22 -13 Z', 8), stroke(circle(0, 0, 9), 8)],
  },
  {
    id: 'dept-operations',
    label: 'Operations',
    mode: 'tintable',
    shapes: [stroke(rr(-26, -22, 52, 44, 4), 8), stroke('M -26 -4 L 26 -4', 7), stroke('M 0 -22 L 0 -4', 7)],
  },
  {
    id: 'dept-administrative',
    label: 'Administrative',
    mode: 'tintable',
    shapes: [stroke('M -26 -14 L -6 -14 L 0 -8 L 26 -8 L 26 20 L -26 20 Z', 8)],
  },

  // --- Need glyphs (tintable) — the six canonical needs ----------------------
  { id: 'need-recognition', label: 'Recognition', mode: 'tintable', shapes: [fill('M 0 -28 L 8 -8 L 30 -8 L 12 6 L 18 28 L 0 14 L -18 28 L -12 6 L -30 -8 L -8 -8 Z')] },
  { id: 'need-competence', label: 'Competence', mode: 'tintable', shapes: [stroke('M -22 0 L -6 18 L 24 -20', 10)] },
  { id: 'need-security', label: 'Security', mode: 'tintable', shapes: [stroke('M 0 -26 L 24 -16 L 24 6 Q 24 24 0 30 Q -24 24 -24 6 L -24 -16 Z', 8)] },
  { id: 'need-belonging', label: 'Belonging', mode: 'tintable', shapes: [fill(HEART)] },
  { id: 'need-rest', label: 'Rest', mode: 'tintable', shapes: [fill('M 8 -24 A 24 24 0 1 0 8 24 A 18 18 0 1 1 8 -24 Z')] },
  {
    id: 'need-autonomy',
    label: 'Autonomy',
    mode: 'tintable',
    // A key — self-determination / control.
    shapes: [stroke(circle(-14, -14, 11), 8), stroke('M -6 -6 L 22 22', 8), stroke('M 22 22 L 28 16', 8), stroke('M 14 14 L 20 8', 8)],
  },

  // --- Relationship CATEGORY glyphs (literal — diegetic color baked in) ------
  {
    id: 'rel-professional',
    label: 'Professional',
    mode: 'literal',
    // Briefcase.
    shapes: [litStroke(rr(-10, -22, 20, 12, 3), UI_PALETTE.relationship.professional, 7), lit(rr(-28, -10, 56, 32, 4), UI_PALETTE.relationship.professional)],
  },
  {
    id: 'rel-social',
    label: 'Social',
    mode: 'literal',
    // Two interlocking rings — a bond.
    shapes: [litStroke(circle(-11, 0, 15), UI_PALETTE.relationship.social, 8), litStroke(circle(11, 0, 15), UI_PALETTE.relationship.social, 8)],
  },
  { id: 'rel-romantic', label: 'Romantic', mode: 'literal', shapes: [lit(HEART, UI_PALETTE.relationship.romantic)] },
  {
    id: 'rel-adversarial',
    label: 'Adversarial',
    mode: 'literal',
    // Lightning bolt.
    shapes: [lit('M 4 -28 L -14 6 L 0 6 L -4 28 L 18 -8 L 4 -8 Z', UI_PALETTE.relationship.adversarial)],
  },

  // ===========================================================================
  // Epic 36 surveillance-workstation chrome glyphs (all tintable). Grounded in
  // the UI epic's named surfaces + the prototype slices of the pressure model and
  // interaction taxonomy (docs/epic-36-ui-assets.md). Floor overlays are NOT here
  // (Shapes draws those); these are the terminal-chrome icons.
  // ===========================================================================

  // --- Transport (S36.1.3) — play/pause are above ---------------------------
  { id: 'ui-step', label: 'Step', mode: 'tintable', shapes: [fill('M -26 -26 L 6 0 L -26 26 Z'), fill(rr(12, -26, 10, 52, 3))] },
  {
    id: 'ui-speed',
    label: 'Speed',
    mode: 'tintable',
    shapes: [fill('M -30 -24 L -2 0 L -30 24 Z'), fill('M 2 -24 L 30 0 L 2 24 Z')],
  },

  // --- Surveillance (F36.5 + visual-design "REC framing") -------------------
  { id: 'ui-capture', label: 'Capture', mode: 'tintable', shapes: [stroke(circle(0, 0, 26), 8), fill(circle(0, 0, 9))] },
  {
    id: 'ui-focus',
    label: 'Focus',
    mode: 'tintable',
    shapes: [
      stroke(circle(0, 0, 20), 7),
      stroke('M 0 -30 L 0 -24'),
      stroke('M 0 24 L 0 30'),
      stroke('M -30 0 L -24 0'),
      stroke('M 24 0 L 30 0'),
      fill(circle(0, 0, 4)),
    ],
  },

  // --- Layer toggles (Tier 2: names / relationships / information / beliefs / environment)
  {
    id: 'layer-names',
    label: 'Names layer',
    mode: 'tintable',
    shapes: [stroke(rr(-28, -16, 56, 32, 5), 7), stroke('M -18 -4 L 12 -4', 6), stroke('M -18 6 L 4 6', 6)],
  },
  {
    id: 'layer-relationships',
    label: 'Relationships layer',
    mode: 'tintable',
    shapes: [
      stroke('M -22 -10 L 22 -10', 6),
      stroke('M -22 -10 L 0 20', 6),
      stroke('M 22 -10 L 0 20', 6),
      fill(circle(-22, -10, 7)),
      fill(circle(22, -10, 7)),
      fill(circle(0, 20, 7)),
    ],
  },
  {
    id: 'layer-information',
    label: 'Information layer',
    mode: 'tintable',
    shapes: [fill(circle(-6, 0, 7)), stroke('M 6 -14 A 18 18 0 0 1 6 14', 6), stroke('M 16 -24 A 30 30 0 0 1 16 24', 6)],
  },
  {
    id: 'layer-beliefs',
    label: 'Beliefs layer',
    mode: 'tintable',
    shapes: [stroke(circle(2, -4, 20), 7), fill(circle(-14, 18, 4)), fill(circle(-22, 27, 2.5))],
  },
  {
    id: 'layer-environment',
    label: 'Environment layer',
    mode: 'tintable',
    shapes: [
      stroke(rr(-24, -26, 48, 52, 3), 7),
      fill(rr(-14, -14, 9, 9, 1)),
      fill(rr(5, -14, 9, 9, 1)),
      fill(rr(-14, 4, 9, 9, 1)),
      fill(rr(5, 4, 9, 9, 1)),
    ],
  },

  // --- Inspector / cause trace (F36.4) --------------------------------------
  {
    id: 'ui-cause-chain',
    label: 'Cause chain',
    mode: 'tintable',
    shapes: [fill(circle(0, -24, 5)), fill(circle(0, 0, 5)), fill(circle(0, 24, 5)), stroke('M 0 -19 L 0 -5', 6), stroke('M 0 5 L 0 19', 6)],
  },
  {
    id: 'ui-unknown',
    label: 'Unknown',
    mode: 'tintable',
    shapes: [stroke('M -10 -12 Q -10 -28 6 -28 Q 22 -28 22 -12 Q 22 2 6 10 L 6 18', 8), fill(circle(6, 30, 4))],
  },
  {
    id: 'ui-truth-belief',
    label: 'Truth vs belief',
    mode: 'tintable',
    // A ring split down the middle; one half filled — observed vs believed.
    shapes: [stroke(circle(0, 0, 24), 7), fill('M 0 -24 A 24 24 0 0 0 0 24 Z')],
  },

  // --- Pressure glyphs (behavioral_pressure_model.md prototype slice of 7) ---
  // One dominant pressure per agent (roster card / floor marker).
  {
    id: 'pressure-suspicion',
    label: 'Suspicion',
    mode: 'tintable',
    shapes: [stroke('M -26 0 Q 0 -16 26 0 Q 0 16 -26 0 Z', 7), fill(circle(0, 0, 6))],
  },
  {
    id: 'pressure-trust-source',
    label: 'Trust in source',
    mode: 'tintable',
    // A verified document.
    shapes: [stroke(rr(-18, -24, 36, 48, 3), 7), stroke('M -9 -2 L -2 6 L 11 -12', 6)],
  },
  {
    id: 'pressure-management-trust',
    label: 'Management trust',
    mode: 'tintable',
    // Confidence directed up toward leadership.
    shapes: [stroke('M -16 -22 L 16 -22', 8), stroke('M 0 24 L 0 -8', 8), stroke('M -14 6 L 0 -8 L 14 6', 8)],
  },
  {
    id: 'pressure-recognition-hunger',
    label: 'Recognition hunger',
    mode: 'tintable',
    // Outlined star (distinct from the filled need-recognition star).
    shapes: [stroke('M 0 -28 L 8 -8 L 30 -8 L 12 6 L 18 28 L 0 14 L -18 28 L -12 6 L -30 -8 L -8 -8 Z', 6)],
  },
  { id: 'pressure-resentment', label: 'Resentment', mode: 'tintable', shapes: [stroke('M -16 -24 L 4 -6 L -8 4 L 14 24', 8)] },
  {
    id: 'pressure-confidence',
    label: 'Confidence',
    mode: 'tintable',
    shapes: [stroke('M -18 6 L 0 -12 L 18 6', 8), stroke('M -18 22 L 0 4 L 18 22', 8)],
  },
  {
    id: 'pressure-routine-interruption',
    label: 'Routine interruption',
    mode: 'tintable',
    // A broken loop.
    shapes: [stroke('M 10 -24 A 26 26 0 1 0 24 10', 8), stroke('M 17 -19 L 31 -7', 8)],
  },

  // --- Intervention dock (interaction_taxonomy.md supported prototype set) ---
  {
    id: 'intervention-submit',
    label: 'Submit request',
    mode: 'tintable',
    // A requisition slip — not a god-button (per visual-design guardrail).
    shapes: [stroke(rr(-20, -26, 40, 52, 3), 7), stroke('M -10 -12 L 10 -12', 6), stroke('M -10 -2 L 10 -2', 6), stroke('M -10 8 L 2 8', 6)],
  },
  {
    id: 'intervention-announcement',
    label: 'Public announcement',
    mode: 'tintable',
    // Megaphone.
    shapes: [fill('M -26 -8 L 4 -18 L 4 18 L -26 8 Z'), fill(rr(8, -14, 8, 28, 2))],
  },
  {
    id: 'intervention-notification',
    label: 'Private notification',
    mode: 'tintable',
    // Envelope.
    shapes: [stroke(rr(-26, -16, 52, 32, 3), 7), stroke('M -26 -12 L 0 6 L 26 -12', 6)],
  },
  {
    id: 'intervention-lock',
    label: 'Break-room lock',
    mode: 'tintable',
    // Padlock.
    shapes: [stroke(rr(-18, -2, 36, 28, 4), 7), stroke('M -10 -2 L -10 -14 A 10 10 0 0 1 10 -14 L 10 -2', 7)],
  },

  // --- Tier-3 review surfaces (F36.6; run-comparison is MVP, deferred) -------
  {
    id: 'review-graph',
    label: 'Relationship graph',
    mode: 'tintable',
    shapes: [
      stroke('M -20 -16 L 20 -14', 5),
      stroke('M -20 -16 L -4 18', 5),
      stroke('M 20 -14 L 24 16', 5),
      stroke('M -4 18 L 24 16', 5),
      fill(circle(-20, -16, 6)),
      fill(circle(20, -14, 6)),
      fill(circle(-4, 18, 6)),
      fill(circle(24, 16, 6)),
    ],
  },
  {
    id: 'review-info-path',
    label: 'Information path',
    mode: 'tintable',
    shapes: [stroke('M -28 16 L -8 -8 L 12 8 L 30 -16', 7), fill(circle(-28, 16, 4)), fill(circle(30, -16, 4))],
  },
  {
    id: 'review-dossier',
    label: 'Case dossier',
    mode: 'tintable',
    // IRIS case file (folder).
    shapes: [stroke('M -26 -12 L -6 -12 L 0 -18 L 26 -18 L 26 18 L -26 18 Z', 7), stroke('M -26 -2 L 26 -2', 5)],
  },

  // --- Misc chrome ----------------------------------------------------------
  { id: 'ui-alert', label: 'Alert', mode: 'tintable', shapes: [stroke('M 0 -22 L 0 6', 9), fill(circle(0, 20, 5))] },
  {
    id: 'iris-mark',
    label: 'IRIS',
    mode: 'tintable',
    // An eye — IRIS, the surveillance chrome voice.
    shapes: [stroke('M -28 0 Q 0 -18 28 0 Q 0 18 -28 0 Z', 7), stroke(circle(0, 0, 9), 6), fill(circle(0, 0, 4))],
  },
];

// --- Cursors (PNG-only; literal so the ink fill + light halo render) ---------
// USS `cursor` and uGUI both need a texture, not a vector — so cursors export
// PNG only. Dark fill under a light halo so the pointer reads on any background.
const INK = UI_PALETTE.ink;
const HALO = UI_PALETTE.onColor;
/** Filled glyph: light halo underneath, ink fill on top. */
const curFill = (d: string): ShapeSpec[] => [
  { d, fill: HALO, stroke: HALO, strokeWidth: 7, silhouette: false },
  { d, fill: INK, silhouette: false },
];
/** Stroked glyph: wide light halo underneath, narrower ink stroke on top. */
const curStroke = (d: string, strokeWidth = 7): ShapeSpec[] => [
  { d, stroke: HALO, strokeWidth: strokeWidth + 6, silhouette: false },
  { d, stroke: INK, strokeWidth, silhouette: false },
];

export const CURSORS: CursorDef[] = [
  {
    id: 'cursor-default',
    label: 'Pointer',
    mode: 'literal',
    // Tip at local (-22,-26) → canvas (42,38) → hotspot below.
    shapes: curFill('M -22 -26 L -22 14 L -12 4 L -4 22 L 2 19 L -6 2 L 8 2 Z'),
    hotspot: { x: 42 / 128, y: 38 / 128 },
  },
  {
    id: 'cursor-grab',
    label: 'Move',
    mode: 'literal',
    shapes: [
      ...curStroke('M 0 -28 L 0 28', 6),
      ...curStroke('M -28 0 L 28 0', 6),
      ...curFill('M 0 -30 L 8 -20 L -8 -20 Z'),
      ...curFill('M 0 30 L 8 20 L -8 20 Z'),
      ...curFill('M -30 0 L -20 -8 L -20 8 Z'),
      ...curFill('M 30 0 L 20 -8 L 20 8 Z'),
    ],
    hotspot: { x: 0.5, y: 0.5 },
  },
  {
    id: 'cursor-place',
    label: 'Place',
    mode: 'literal',
    shapes: [
      ...curStroke('M 0 -26 L 0 -8'),
      ...curStroke('M 0 8 L 0 26'),
      ...curStroke('M -26 0 L -8 0'),
      ...curStroke('M 8 0 L 26 0'),
      ...curFill(circle(0, 0, 4)),
    ],
    hotspot: { x: 0.5, y: 0.5 },
  },
  {
    id: 'cursor-invalid',
    label: 'Invalid',
    mode: 'literal',
    shapes: [...curStroke(circle(0, 0, 24)), ...curStroke('M -17 -17 L 17 17')],
    hotspot: { x: 0.5, y: 0.5 },
  },
];

const BY_ID: Record<string, IconDef> = Object.fromEntries([...ICONS, ...CURSORS].map((i) => [i.id, i]));

/** Lookup by id (icons or cursors), or undefined for unknown (caller draws nothing). */
export function getIcon(id: string): IconDef | undefined {
  return BY_ID[id];
}
