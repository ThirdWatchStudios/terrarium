import type { CharacterRecipe, Palette } from './types';

/**
 * Renderings — register-constitution.md Article VIII (as amended 2026-07-02).
 *
 * There is no canonical image of an employee; there are only renderings, each
 * with an author. Terrarium therefore does not create an "employee sprite" —
 * it creates an employee IDENTITY (the recipe) with RENDERERS:
 *
 *   identity (recipe)
 *     ├─ operational unit  → the floor; authored by IRIS. A PICTOGRAM, not a
 *     │                      re-tinted sprite: flat coding-hue figure,
 *     │                      featureless dark head disc, no face, no hair —
 *     │                      identity is color + silhouette + (sim-side)
 *     │                      label. And it moves like a person: same canvas,
 *     │                      anchors and pose rig, so conduct passes through
 *     │                      undistorted.
 *     ├─ corporate identity → badge photo; authored by the corporation. Warm,
 *     │                      curated, official (composePortrait, compositor.ts).
 *     ├─ human presence    → Slack avatar; authored by the person. (Deferred:
 *     │                      avatar CHOICE is persona-derived characterization
 *     │                      — a design surface, not a transform.)
 *     └─ reality           → never rendered, by law.
 *
 * The law the code enforces: every register redraws the person; none may
 * rewrite their behavior. The unit renderer swaps parts + pigment ONLY — it
 * cannot touch anchors, poses, or timing, by construction.
 *
 * Note on temperature: the unit is NOT grey. Cold is not the absence of
 * color — it is color as CATEGORY CODING (a marker on a map, not clothes).
 * The coding hue derives from the identity's outfit so regulars stay
 * recognizable, but it is normalized to a flat institutional tone.
 */

// --- tiny color helpers (hex in, hex out) -------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return rgbToHex(l * 255, l * 255, l * 255);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return rgbToHex(hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255);
}

/** The unit's ink — head disc and hands. One tone for everyone: no face, no complexion. */
export const UNIT_INK = '#333A40';
/** Coding tone for identities whose outfit is too grey to carry a hue. */
const UNIT_FALLBACK = '#6B7683';

/**
 * The identity's outfit hue, normalized to a flat institutional coding tone —
 * the mockup grammar: each agent one clean mid hue (green / orange / purple),
 * saturation and lightness clamped so no unit is louder than another.
 */
export function codingHue(hex: string): string {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  if (s < 0.1) return UNIT_FALLBACK;
  return hslToHex(h, 0.34, 0.52);
}

/** A step darker than the coding hue — trim/secondary on the pictogram. */
function codingShade(hex: string): string {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  if (s < 0.1) return UNIT_INK;
  return hslToHex(h, 0.34, 0.38);
}

/** The operational-unit palette: coding hue + one ink. Fully anonymized head. */
export function unitPalette(palette: Palette): Palette {
  return {
    skin: UNIT_INK,
    hair: UNIT_INK,
    outfitPrimary: codingHue(palette.outfitPrimary),
    outfitSecondary: codingShade(palette.outfitPrimary),
    accent: UNIT_INK,
  };
}

/** The pictogram parts — IRIS's figure (internal parts, parts/library.ts). */
export const UNIT_PARTS = {
  body: 'body-unit',
  head: 'head-unit',
  hair: 'none', // unknown ids draw nothing, by design
  outfit: 'none',
  accessories: [] as string[],
};

/**
 * The identity as IRIS draws it: pictogram parts, coding pigment, same rig.
 * Everything downstream (pose sheets, the harness, atlases) composes it like
 * any recipe — conduct is untouched by construction.
 */
export function unitRecipe(recipe: CharacterRecipe): CharacterRecipe {
  return {
    ...recipe,
    parts: { ...UNIT_PARTS, accessories: [...UNIT_PARTS.accessories] },
    palette: unitPalette(recipe.palette),
  };
}

/** The exported rendering spec (`recipe.json#renderings.unit`, CONTRACT §3.17). */
export function unitRenderingSpec(recipe: CharacterRecipe) {
  return {
    author: 'iris' as const,
    parts: { ...UNIT_PARTS, accessories: [...UNIT_PARTS.accessories] },
    palette: unitPalette(recipe.palette),
  };
}
