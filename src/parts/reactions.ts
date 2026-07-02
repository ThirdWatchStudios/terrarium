import type { IconDef } from './icons';
import type { ShapeSpec } from '../core/types';
import { circle } from '../core/geometry';
import { UI_PALETTE } from '../data/uiPalette';

/**
 * Reaction emoji — the HUMAN register's glyph set (register-constitution.md
 * Article V.3). The floor speaks in bodies (truth), the chrome speaks in claims
 * (IRIS); this is the third voice: what people CHOOSE to say, stamped on Slack
 * messages in the sim's log panel. The tool authors only this vocabulary — the
 * messages themselves are sim-side writing.
 *
 * Register law shapes the art:
 *   - LITERAL mode, always. A reaction is quoted speech; the chrome never tints
 *     it into its own voice. The warm face-yellow is deliberately foreign to the
 *     chrome palette — a spot of floor temperature inside the cold log
 *     (Article VIII: temperature is register).
 *   - The set is SMALL and workplace-canon (Article IX). Eight ids; a ninth
 *     needs a register + failure-mode statement per the constitution.
 *   - Ids are the cross-repo contract (`reaction-<id>` in the icons manifest);
 *     art may be revised freely. Unknown ids fall back to text per CONTRACT.md.
 *
 * Same authoring grammar as icons.ts: local coords centered on (0,0), legible
 * at ~20px, bold forms, generous negative space, extent ~±44.
 */

const R = UI_PALETTE.reaction;
const INK = R.faceInk;

const face = (): ShapeSpec => ({ d: circle(0, 0, 40), fill: R.face, silhouette: false });
const ink = (d: string, strokeWidth = 6): ShapeSpec => ({ d, stroke: INK, strokeWidth, silhouette: false });
const inkFill = (d: string): ShapeSpec => ({ d, fill: INK, silhouette: false });
const lit = (d: string, fill: string): ShapeSpec => ({ d, fill, silhouette: false });
const litStroke = (d: string, stroke: string, strokeWidth = 6): ShapeSpec => ({ d, stroke, strokeWidth, silhouette: false });

/** Canonical reaction ids (bare, without the `reaction-` icon prefix). */
export const REACTIONS = [
  'thumbs-up',
  'heart',
  'joy',
  'eyes',
  'fire',
  'party',
  'thinking',
  'sweat',
] as const;

export type Reaction = (typeof REACTIONS)[number];

const ART: Record<Reaction, { label: string; shapes: ShapeSpec[] }> = {
  // 👍 — the workplace's load-bearing non-answer.
  'thumbs-up': {
    label: 'Thumbs up',
    shapes: [
      lit(
        'M -18 -2 L -10 -4 Q -2 -12 2 -22 Q 6 -33 14 -30 Q 22 -27 18 -14 L 14 -2 L 26 -2 Q 36 -2 34 8 L 30 30 Q 28 38 18 38 L -8 38 Q -14 38 -18 34 Z',
        R.hand,
      ),
      ink(
        'M -18 -2 L -10 -4 Q -2 -12 2 -22 Q 6 -33 14 -30 Q 22 -27 18 -14 L 14 -2 L 26 -2 Q 36 -2 34 8 L 30 30 Q 28 38 18 38 L -8 38 Q -14 38 -18 34 Z',
        4,
      ),
      lit('M -36 -2 L -22 -2 L -22 38 L -36 38 Z', R.face),
      ink('M -36 -2 L -22 -2 L -22 38 L -36 38 Z', 4),
    ],
  },

  // ❤️
  heart: {
    label: 'Heart',
    shapes: [lit('M 0 34 C -42 6 -30 -30 0 -10 C 30 -30 42 6 0 34 Z', R.heart)],
  },

  // 😂 — closed happy eyes, open laugh, tears at both cheeks.
  joy: {
    label: 'Laughing',
    shapes: [
      face(),
      ink('M -24 -10 Q -15 -20 -6 -10'),
      ink('M 6 -10 Q 15 -20 24 -10'),
      inkFill('M -18 8 A 18 18 0 0 0 18 8 Q 0 14 -18 8 Z'),
      lit('M -34 -2 Q -28 6 -34 14 Q -41 6 -34 -2 Z', UI_PALETTE.status.info),
      lit('M 34 -2 Q 40 6 34 14 Q 27 6 34 -2 Z', UI_PALETTE.status.info),
    ],
  },

  // 👀 — both pupils dragged to one side: attention, and its direction.
  eyes: {
    label: 'Eyes',
    shapes: [
      lit('M -34 0 A 14 20 0 1 0 -6 0 A 14 20 0 1 0 -34 0 Z', UI_PALETTE.onColor),
      ink('M -34 0 A 14 20 0 1 0 -6 0 A 14 20 0 1 0 -34 0 Z', 4),
      lit('M 6 0 A 14 20 0 1 0 34 0 A 14 20 0 1 0 6 0 Z', UI_PALETTE.onColor),
      ink('M 6 0 A 14 20 0 1 0 34 0 A 14 20 0 1 0 6 0 Z', 4),
      inkFill(circle(-26, 4, 6)),
      inkFill(circle(14, 4, 6)),
    ],
  },

  // 🔥
  fire: {
    label: 'Fire',
    shapes: [
      lit(
        'M 0 -42 Q 16 -22 10 -6 Q 24 -14 26 4 Q 28 32 0 40 Q -28 32 -26 4 Q -24 -14 -12 -24 Q -4 -32 0 -42 Z',
        R.fire,
      ),
      lit('M 0 -4 Q 10 8 7 18 Q 14 24 8 32 Q 0 38 -8 32 Q -14 24 -7 16 Q -10 6 0 -4 Z', R.face),
    ],
  },

  // 🎉 — cone and confetti.
  party: {
    label: 'Party',
    shapes: [
      lit('M -36 36 L -8 -4 L 18 20 Z', R.party),
      ink('M -36 36 L -8 -4 L 18 20 Z', 4),
      litStroke('M -2 -14 Q 6 -26 2 -38', R.heart, 5),
      litStroke('M 12 -6 Q 24 -12 34 -8', R.fire, 5),
      lit(circle(16, -28, 4.5), UI_PALETTE.status.info),
      lit(circle(34, -26, 3.5), R.heart),
      lit(circle(36, 8, 4), R.fire),
    ],
  },

  // 🤔 — raised brow, level brow, side-set pupils, slanted mouth, chin hand.
  thinking: {
    label: 'Thinking',
    shapes: [
      face(),
      ink('M 6 -24 Q 14 -30 22 -24'),
      ink('M -22 -16 L -8 -16'),
      inkFill(circle(-14, -6, 4)),
      inkFill(circle(14, -8, 4)),
      ink('M -14 16 L 6 12'),
      lit('M -28 24 Q -12 18 2 26 L 0 36 Q -16 40 -28 32 Z', R.hand),
      ink('M -28 24 Q -12 18 2 26 L 0 36 Q -16 40 -28 32 Z', 4),
    ],
  },

  // 😅 — the relieved grin with the single sweat drop.
  sweat: {
    label: 'Sweat smile',
    shapes: [
      face(),
      ink('M -24 -10 Q -15 -20 -6 -10'),
      ink('M 6 -10 Q 15 -20 24 -10'),
      ink('M -16 10 Q 0 26 16 10'),
      lit('M 32 -34 Q 40 -22 40 -14 Q 40 -4 32 -4 Q 24 -4 24 -14 Q 24 -22 32 -34 Z', UI_PALETTE.status.info),
    ],
  },
};

/**
 * The icons-manifest emission: every reaction as a literal `reaction-<id>` icon.
 * Spread into ICONS (icons.ts) beside the emotion and state registers.
 */
export const REACTION_ICONS: IconDef[] = REACTIONS.map((id) => ({
  id: `reaction-${id}`,
  label: ART[id].label,
  mode: 'literal',
  shapes: ART[id].shapes,
}));
