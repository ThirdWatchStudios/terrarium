import type { CharacterRecipe, Palette } from './types';

/**
 * Renderings — register-constitution.md Article VIII (as amended 2026-07-02).
 *
 * There is no canonical image of an employee; there are only renderings, each
 * with an author. Terrarium therefore does not create an "employee sprite" —
 * it creates an employee IDENTITY (the recipe) with RENDERERS:
 *
 *   identity (recipe)
 *     ├─ operational unit  → the floor; authored by IRIS. Cold, near-anonymous,
 *     │                      institutional — and it moves like a person: the
 *     │                      unit transform touches ONLY pigment; silhouette,
 *     │                      pose, and beat pass through undistorted.
 *     ├─ corporate identity → badge photo; authored by the corporation. Warm,
 *     │                      curated, official (composePortrait, compositor.ts).
 *     ├─ human presence    → Slack avatar; authored by the person. (Deferred:
 *     │                      avatar CHOICE is persona-derived characterization
 *     │                      — a design surface, not a palette transform.)
 *     └─ reality           → never rendered, by law.
 *
 * The law the code enforces: every register redraws the person; none may
 * rewrite their behavior. The unit transform is a pure palette map — it cannot
 * touch geometry, anchors, poses, or timing, by construction.
 */

// --- color helpers (hex in, hex out; duplicated small on purpose — look.ts owns surfaces) ----

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function mix(a: string, b: string, k: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k);
}

function lum(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** The unit's institutional cast — a cool slate, IRIS's idea of a person. */
export const UNIT_SLATE = '#6B7683';

/**
 * One token color → its operational-unit equivalent. Collapse toward the
 * grey of its own lightness (so light hair stays light, dark stays dark —
 * the silhouette identity survives), keep a whisper of the source hue (a
 * once-green cardigan reads faintly green at close zoom), and nudge the
 * whole thing toward the institutional slate.
 */
export function unitColor(hex: string): string {
  const l = lum(hex) * 255;
  const grey = rgbToHex(l, l, l);
  return mix(mix(hex, grey, 0.8), UNIT_SLATE, 0.22);
}

/**
 * The operational-unit palette. Skin is handled harder than the rest: all
 * complexions converge toward one pale institutional tone (lightness mostly
 * flattened) — the unit is NEAR-anonymous by design; hair and outfit keep
 * their lightness so you can still tell your regulars apart at floor zoom.
 */
export function unitPalette(palette: Palette): Palette {
  const skinL = lum(palette.skin);
  // Compress skin lightness range hard toward a single pale tone.
  const flatL = (0.72 + skinL * 0.12) * 255;
  const skin = mix(rgbToHex(flatL, flatL, flatL), UNIT_SLATE, 0.18);
  return {
    skin,
    hair: unitColor(palette.hair),
    outfitPrimary: unitColor(palette.outfitPrimary),
    outfitSecondary: unitColor(palette.outfitSecondary),
    accent: unitColor(palette.accent),
  };
}

/** The identity re-dressed by IRIS: same parts, same anchors, unit pigment. */
export function unitRecipe(recipe: CharacterRecipe): CharacterRecipe {
  return { ...recipe, palette: unitPalette(recipe.palette) };
}
