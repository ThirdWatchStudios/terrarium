import type { ProjectState, StyleSheet } from './types';
import { DEFAULT_LOOK } from './types';
import { NATURAL_GROUND_TEMPLATE_IDS, WATER_TEMPLATE_IDS } from '../tiles/templates';
import { NATURE_PROP_TEMPLATE_IDS } from '../props/templates';

/**
 * Project-wide "looks" — coordinated restyles that touch BOTH the style sheet
 * (outline/shadow/proportions) and the per-instance surface palettes (props,
 * walls, floors) in one move. The style system was built so no style is ever
 * baked into parts; a look is where that pays off: the whole office changes
 * temperature as a data edit.
 *
 * The first look is the register constitution made visible (Article VIII —
 * temperature is register, and docs/quotaos-tone-temperature felt-target):
 *
 *   CLINICAL PLAN — the floor as IRIS renders it: near-white architectural
 *   surfaces with thin uniform ink lines, no cast shadows, faint residual hue
 *   (a plan, not an illustration). The environment recedes so the people
 *   read. PEOPLE ARE DELIBERATELY UNTOUCHED — bodies keep their skin, hair
 *   and outfit hues, staying the only warm, saturated thing on the plan.
 *   Quiet is not cold for them; the architecture goes clinical, the humans
 *   do not.
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

function mix(a: string, b: string, k: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k);
}

/** Relative luminance 0..1 (cheap, non-gamma — fine for ramp decisions). */
function lum(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// --- the clinical surface ramp --------------------------------------------------

/** The paper the plan is printed on. */
export const CLINICAL_PAPER = '#EDE9DF';
/** The plan's ink — thin, uniform, near-black with a warm cast. */
export const CLINICAL_INK = '#3A3B38';

/**
 * Map one surface color onto the plan. Lightness-aware: mid/light colors
 * collapse into paper (a desk is a pale outline, not furniture art); dark
 * detail colors keep contrast so equipment still reads as thin linework.
 * A faint trace of the source hue survives (glass stays barely blue) — plans
 * are near-mono, not mono.
 */
export function clinicalSurfaceColor(hex: string): string {
  const L = lum(hex);
  // How far toward paper: dark inks move a little, light fills move almost all the way.
  const toPaper = 0.3 + 0.55 * L;
  const paperMixed = mix(hex, CLINICAL_PAPER, toPaper);
  // Crush remaining saturation toward the neutral of its own lightness.
  const l = lum(paperMixed) * 255;
  return mix(paperMixed, rgbToHex(l, l, l), 0.55);
}

/** The character/outline half of the look. People's palette pools are NOT touched. */
export function clinicalStyle(base: StyleSheet): StyleSheet {
  const style = structuredClone(base);
  style.outline = { width: 2, color: CLINICAL_INK, mode: 'silhouette' };
  style.render.contactShadow = 0; // plans cast no shadows
  style.render.ambientTint = 0; //  and carry no mood wash — the registers do that job
  return style;
}

/**
 * The project as it should RENDER under its chosen look — a non-destructive lens
 * over the authored palettes (core/types.ts `ProjectState.look`). This is the
 * seam the exporter and previews resolve through, so the look is reproducible:
 * every asset refresh re-derives it from the persisted flag instead of relying
 * on a one-time palette sweep that silently drops when assets are re-randomized.
 *
 * `raw` returns the project untouched (same reference — no clone). `clinical`
 * returns a deep clone with {@link applyClinicalLook} applied, leaving the input
 * (the authored, vivid, still-editable project) untouched. Absent look ⇒
 * {@link DEFAULT_LOOK}.
 */
export function projectWithLook(project: ProjectState): ProjectState {
  const look = project.look ?? DEFAULT_LOOK;
  if (look !== 'clinical') {
    return project;
  }

  const lensed = structuredClone(project);
  applyClinicalLook(lensed);
  lensed.look = 'clinical';
  return lensed;
}

/**
 * Apply the clinical-plan look to the whole project: style sheet + every
 * prop/wall/floor palette. Characters keep their recipes untouched (people
 * stay warm — Article VIII). NATURE is exempt too (D2 amended): natural ground
 * (grass / meadow / dirt), ornamental water, and the nature decor props (trees /
 * bushes / flowers / boulders / reeds) keep their saturated authored palettes,
 * so the drained building visibly displaces living ground — nature is TRUTH,
 * like people; the PAVED surfaces and the cars drain with the office.
 * Idempotent: re-applying converges. MUTATES the argument — callers wanting a
 * non-destructive result use {@link projectWithLook}.
 */
export function applyClinicalLook(project: ProjectState): void {
  project.style = clinicalStyle(project.style);
  const natureProps = new Set<string>(NATURE_PROP_TEMPLATE_IDS);
  for (const prop of project.props) {
    if (natureProps.has(prop.templateId)) continue;
    prop.palette = {
      primary: clinicalSurfaceColor(prop.palette.primary),
      secondary: clinicalSurfaceColor(prop.palette.secondary),
      accent: clinicalSurfaceColor(prop.palette.accent),
    };
  }
  const exemptGround = new Set<string>([
    ...NATURAL_GROUND_TEMPLATE_IDS,
    ...WATER_TEMPLATE_IDS,
  ]);
  const pavedGround = (project.ground ?? []).filter((g) => !exemptGround.has(g.templateId));
  for (const tile of [...(project.walls ?? []), ...(project.floors ?? []), ...pavedGround]) {
    tile.palette = {
      primary: clinicalSurfaceColor(tile.palette.primary),
      secondary: clinicalSurfaceColor(tile.palette.secondary),
      accent: clinicalSurfaceColor(tile.palette.accent),
    };
  }
}
