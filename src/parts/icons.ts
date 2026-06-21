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
