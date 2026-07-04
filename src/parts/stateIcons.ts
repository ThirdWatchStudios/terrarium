import type { IconDef } from './icons';
import type { ShapeSpec } from '../core/types';
import { circle } from '../core/geometry';
import { EMOTION_ICONS } from './emotions';

/**
 * UI-STATE-ICON set — the chrome register of the overhead state-glyph
 * vocabulary. The sim's workstation UI (the inspector SIGNALS strip, Thread,
 * dossier) surfaces an agent's active floor states as icon + label; the floor
 * bubbles (activity-badges / social-state-badges / mood-emotes / emotion-glyphs
 * / attention-puffs) are authored as sitcom speech-bubble art and read poorly
 * as UI iconography. Dual-register rule: the FLOOR speaks in bubbles, the
 * CHROME speaks in clinical single-color line icons — this file is the chrome
 * side, one tintable `state-<family>-<id>` icon per floor-state cell.
 *
 * Ids are the cross-repo contract (the sim resolves them through the ui-icons
 * catalog with fallback to the floor sprites); art may be revised freely.
 * Coverage mirrors the floor atlases exactly:
 *   - state-activity-*  → the sim-listed routine states (subset of ACTIVITIES;
 *                         `none`/`lunch`/`monitoring` are not surfaced as signals)
 *   - state-social-*    → SOCIAL_STATES (all 5)
 *   - state-mood-*      → the EMOTED moods (the mood-emotes atlas cells; `normal`
 *                         has no cell, so no icon)
 *   - state-emotion-*   → EMOTION_DEFS (all 17, incl. vindication / relief)
 *   - state-attn-*      → ATTENTION_PUFFS (all 4)
 *
 * Style: same white-mask line grammar as the ui-* icons, but TIGHT CROP — the
 * glyph fills the 128u frame to roughly ±50 (~8% padding; the floor bubbles'
 * wide margins are the main thing this register fixes). Strokes 7–12u so the
 * mark stays readable tinted on light or dark chrome at 20–32 px. Where the
 * floor glyph has a strong silhouette (the harvestable gem, the conflict
 * shuriken, the tremor lines) the silhouette carries over, re-drawn in line
 * style, so recognition survives the register switch.
 */

// --- tintable helpers (color ignored — emitted as a white mask) --------------
const ACC = '$accent'; // marker only; recolored by the framework
const stroke = (d: string, strokeWidth = 9): ShapeSpec => ({ d, stroke: ACC, strokeWidth, silhouette: false });
const fill = (d: string): ShapeSpec => ({ d, fill: ACC, silhouette: false });

/**
 * A regular N-point star/burst outline (same generator shape as the floor
 * puffs' silhouettes in attention.ts, at icon coordinates) — keeps the spark /
 * shuriken silhouettes recognizable across registers. Pure, so output is
 * deterministic.
 */
function burst(points: number, outer: number, inner: number, rot = -90): string {
  const seg: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rot + (180 / points) * i) * Math.PI) / 180;
    seg.push(`${i === 0 ? 'M' : 'L'} ${+(r * Math.cos(a)).toFixed(2)} ${+(r * Math.sin(a)).toFixed(2)}`);
  }
  return `${seg.join(' ')} Z`;
}

// --- Activity states (routine vocabulary, activities.ts) ---------------------
const ACTIVITY_STATE_ICONS: IconDef[] = [
  {
    id: 'state-activity-work',
    label: 'Working',
    mode: 'tintable',
    // Monitor on a stand — the badge's "at the desk" read, line style.
    shapes: [stroke('M -40 -44 L 40 -44 L 40 12 L -40 12 Z', 9), stroke('M 0 12 L 0 32', 9), stroke('M -22 36 L 22 36', 9)],
  },
  {
    id: 'state-activity-walk',
    label: 'Walking',
    mode: 'tintable',
    // Motion chevrons, straight off the badge.
    shapes: [stroke('M -38 -34 L -2 0 L -38 34', 11), stroke('M 2 -34 L 38 0 L 2 34', 11)],
  },
  {
    id: 'state-activity-break',
    label: 'On break',
    mode: 'tintable',
    // Coffee cup, handle and steam.
    shapes: [
      stroke('M -34 -8 L 22 -8 L 22 16 Q 22 40 -6 40 Q -34 40 -34 16 Z', 9),
      stroke('M 22 0 Q 42 0 42 14 Q 42 26 26 26', 8),
      stroke('M -18 -22 Q -10 -30 -18 -42', 7),
      stroke('M 4 -22 Q 12 -30 4 -42', 7),
    ],
  },
  {
    id: 'state-activity-meeting',
    label: 'In a meeting',
    mode: 'tintable',
    // Two figures at a shared table (the table line keeps it distinct from the
    // app-employee-directory roster pair).
    shapes: [
      fill(circle(-20, -26, 10)),
      fill(circle(20, -26, 10)),
      stroke('M -38 6 Q -20 -10 -2 6', 9),
      stroke('M 2 6 Q 20 -10 38 6', 9),
      stroke('M -44 26 L 44 26', 8),
    ],
  },
  {
    id: 'state-activity-talking',
    label: 'Talking',
    mode: 'tintable',
    // A speech balloon as SUBJECT (the universal "talking" mark) — allowed here;
    // the banned bubble is the floor-art carrier, not the glyph's subject.
    shapes: [
      stroke('M -40 -32 L 40 -32 L 40 12 L -8 12 L -26 32 L -20 12 L -40 12 Z', 8),
      fill(circle(-16, -10, 5)),
      fill(circle(0, -10, 5)),
      fill(circle(16, -10, 5)),
    ],
  },
  {
    id: 'state-activity-idle',
    label: 'Idle',
    mode: 'tintable',
    // Two z's.
    shapes: [stroke('M -38 2 L -10 2 L -38 30 L -10 30', 9), stroke('M -4 -38 L 40 -38 L -4 6 L 40 6', 10)],
  },
  {
    id: 'state-activity-disrupted',
    label: 'Disrupted',
    mode: 'tintable',
    // The broken loop — same mark the badge and pressure-routine-interruption
    // carry, so "routine knocked off course" rhymes across all three surfaces.
    shapes: [stroke('M 15 -36 A 39 39 0 1 0 36 15', 10), stroke('M 25 -28 L 46 -10', 10)],
  },
];

// --- Short-term social states (socialStates.ts) -------------------------------
const SOCIAL_STATE_STATE_ICONS: IconDef[] = [
  {
    id: 'state-social-anxious',
    label: 'Anxious',
    mode: 'tintable',
    // The tremor lines — the badge's shaking-nerves silhouette.
    shapes: [
      stroke('M -44 -10 Q -33 -30 -22 -10 Q -11 10 0 -10 Q 11 -30 22 -10 Q 33 10 44 -10', 9),
      stroke('M -30 24 Q -20 8 -10 24 Q 0 40 10 24 Q 20 8 30 24', 7),
    ],
  },
  {
    id: 'state-social-slighted',
    label: 'Slighted',
    mode: 'tintable',
    // The chevron pressing down on a lone dot — the put-down, seen from outside.
    shapes: [stroke('M -36 -30 L 0 4 L 36 -30', 10), fill(circle(0, 32, 12))],
  },
  {
    id: 'state-social-defensive',
    label: 'Defensive',
    mode: 'tintable',
    // Shield up.
    shapes: [stroke('M 0 -44 L 38 -30 L 38 2 Q 38 30 0 44 Q -38 30 -38 2 L -38 -30 Z', 9)],
  },
  {
    id: 'state-social-confident',
    label: 'Confident',
    mode: 'tintable',
    // Double ascent (rhymes with pressure-confidence, as the badge does).
    shapes: [stroke('M -36 -6 L 0 -40 L 36 -6', 10), stroke('M -36 38 L 0 4 L 36 38', 10)],
  },
  {
    id: 'state-social-reassured',
    label: 'Reassured',
    mode: 'tintable',
    // The settled dot under a covering arc.
    shapes: [stroke('M -38 10 Q -38 -38 0 -38 Q 38 -38 38 10', 9), fill(circle(0, 26, 13))],
  },
];

// --- Moods (the emoted mood-emotes atlas cells; moods.ts) ---------------------
const MOOD_STATE_ICONS: IconDef[] = [
  {
    id: 'state-mood-anxious',
    label: 'Anxious',
    mode: 'tintable',
    // Sweat drop — the nervous bead, as on the emote bubble.
    shapes: [fill('M 0 -36 Q 24 4 0 28 Q -24 4 0 -36 Z')],
  },
  {
    id: 'state-mood-slighted',
    label: 'Slighted',
    mode: 'tintable',
    // Downturned pout — lowered eyes over an offended frown.
    shapes: [stroke('M -30 12 Q 0 -16 30 12', 10), fill(circle(-22, -22, 6)), fill(circle(22, -22, 6))],
  },
  {
    id: 'state-mood-confident',
    label: 'Confident',
    mode: 'tintable',
    // Upward check — assured, affirmed.
    shapes: [stroke('M -28 0 L -8 22 L 32 -26', 12)],
  },
  {
    id: 'state-mood-defensive',
    label: 'Defensive (mood)',
    mode: 'tintable',
    // Exclamation — the emote's silhouette kept faithful. Reads close to
    // ui-alert at a tighter crop; the SIGNALS strip pairs it with a label.
    shapes: [stroke('M 0 -44 L 0 12', 12), fill(circle(0, 38, 9))],
  },
  {
    id: 'state-mood-reassured',
    label: 'Reassured',
    mode: 'tintable',
    // Gentle smile — calmed, comforted.
    shapes: [stroke('M -30 -8 Q 0 22 30 -8', 10), fill(circle(-22, -22, 6)), fill(circle(22, -22, 6))],
  },
];

// --- Emotions (the full harvest vocabulary; emotions.ts) ----------------------
// Geometry is authored ONCE in emotions.ts; this register reuses the existing
// `emotion-<id>` chrome masks and only re-fits them to the tight state-icon
// crop. Per-id scale is hand-fit so each mark lands near ±50 (the marks' native
// extents vary; a uniform factor would leave the small ones swimming).
const EMOTION_FIT: Record<string, number> = {
  resentment: 1.7,
  frustration: 1.5,
  anger: 1.25,
  spite: 1.6,
  jealousy: 1.35,
  envy: 1.6,
  anxiety: 1.7,
  fear: 1.7,
  insecurity: 1.9,
  overwhelm: 1.75,
  loneliness: 1.9,
  boredom: 1.7,
  ambition: 1.5,
  pride: 1.6,
  embarrassment: 1.9,
  vindication: 1.45,
  relief: 1.7,
};

const EMOTION_STATE_ICONS: IconDef[] = EMOTION_ICONS.map((i) => ({
  ...i,
  id: `state-${i.id}`, // emotion-<id> → state-emotion-<id>
  scale: EMOTION_FIT[i.id.replace(/^emotion-/, '')] ?? 1.5,
}));

// --- Attention categories (attention.ts) --------------------------------------
const ATTENTION_STATE_ICONS: IconDef[] = [
  {
    id: 'state-attn-emotion-spike',
    label: 'Emotion spike',
    mode: 'tintable',
    // The 8-point spark silhouette in line style, ECG peak inside.
    shapes: [stroke(burst(8, 46, 24), 7), stroke('M -18 6 L -6 6 L 2 -14 L 10 6 L 18 6', 7)],
  },
  {
    id: 'state-attn-conflict',
    label: 'Conflict',
    mode: 'tintable',
    // The 4-point shuriken silhouette in line style, versus-X inside.
    shapes: [stroke(burst(4, 48, 13), 7), stroke('M -11 -11 L 11 11', 9), stroke('M 11 -11 L -11 11', 9)],
  },
  {
    id: 'state-attn-information',
    label: 'Information passed',
    mode: 'tintable',
    // The note in motion — envelope with travel dashes (a plain envelope is
    // already ui-mail; the dashes say "changed hands").
    shapes: [
      stroke('M -20 -26 L 44 -26 L 44 18 L -20 18 Z', 8),
      stroke('M -20 -26 L 12 0 L 44 -26', 8),
      stroke('M -46 -14 L -30 -14', 8),
      stroke('M -42 4 L -30 4', 8),
    ],
  },
  {
    id: 'state-attn-harvestable',
    label: 'Harvestable',
    mode: 'tintable',
    // The faceted gem — the floor's strongest silhouette, kept intact.
    shapes: [
      stroke('M -25 -37 L 25 -37 L 45 -15 L 0 40 L -45 -15 Z', 9),
      stroke('M -45 -15 L 45 -15', 6),
      stroke('M -25 -37 L -13 -15', 6),
      stroke('M 25 -37 L 13 -15', 6),
      stroke('M -13 -15 L 0 40', 6),
      stroke('M 13 -15 L 0 40', 6),
    ],
  },
];

/** The full state-icon register, spread into ICONS (icons.ts). */
export const STATE_ICONS: IconDef[] = [
  ...ACTIVITY_STATE_ICONS,
  ...SOCIAL_STATE_STATE_ICONS,
  ...MOOD_STATE_ICONS,
  ...EMOTION_STATE_ICONS,
  ...ATTENTION_STATE_ICONS,
];
