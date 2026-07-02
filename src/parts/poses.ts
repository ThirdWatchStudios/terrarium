import type { Facing, ShapeSpec } from '../core/types';
import { CURRENT_SCHEMA_VERSION } from '../core/types';
import { circle } from '../core/geometry';

/**
 * Pose vocabulary — the arm/posture layer of the Social Theater pipeline
 * (docs/social-theater-presentation-experiment.md Appendix B, built per
 * Appendix C: the pose + beat data model precedes the 2D-vs-3D verdict and is
 * renderer-agnostic authoring).
 *
 * Boundary (docs/performance-direction-contract.md Article VI, CONTRACT §3.16):
 * the tool authors WHICH poses exist (this catalog: art + reads-as + the
 * presence channels that shape each); the sim's Director owns SEQUENCING (beat
 * schedules, dwell times, blocking); the renderer knows only
 * `pose · orientation · hold · move`. A pose is a sim-selected STATE, like a
 * mood — never stored in the recipe, exported per character as full posed
 * frames keyed `<pose>_<facing>` (register: truth — bodies leak).
 *
 * Anatomy budget confirmed by the readability mockup: shoulders + one
 * arm-pair. No elbows/hands/legs as rig parts. Torso/head adjustments are
 * GROUP TRANSFORMS (like headScale) so they can lerp without frame animation:
 *   - headTiltDeg / headDropY: applied to the head group around the neck.
 *   - bodyLeanDeg: applied to the body group around the hip — only rendered on
 *     east/west (a profile lean; on south/north it would read as a sideways
 *     topple). The west mirror flips it automatically.
 *
 * Authoring frame: BODY-LOCAL coords (anchor `body` = canvas 64,87), same as
 * the outfit overlays. The standard capsule spans x −28..28 / y −29..29 south
 * (x −22..22 east); shoulders sit at (±26, −21) south. Arms are thick round-cap
 * strokes in `$outfitPrimary` (sleeves) with a `$skin` hand dot at the wrist —
 * silhouette-participating, because the pose IS the silhouette change.
 */

export type Pose =
  | 'neutral'
  | 'walk-approach'
  | 'notice'
  | 'arms-crossed'
  | 'hands-on-hips'
  | 'point'
  | 'slump'
  | 'walk-away';

/** Canonical order — also the pose-sheet row order and the atlas key order. */
export const POSES: Pose[] = [
  'neutral',
  'walk-approach',
  'notice',
  'arms-crossed',
  'hands-on-hips',
  'point',
  'slump',
  'walk-away',
];

/** Arm layers for one facing. `front` draws over body+outfit (under the head); `back` behind the body. */
export interface PoseVariant {
  front: ShapeSpec[];
  back?: ShapeSpec[];
}

/** Group-transform adjustments — lerpable posture, not new art. */
export interface PoseTransforms {
  /** Head rotation around the neck, degrees (positive = clockwise / chin toward +x). */
  headTiltDeg?: number;
  /** Head drop toward the chest, canvas units (the slump read). */
  headDropY?: number;
  /** Body lean around the hip, degrees — rendered on east/west only (profile lean). */
  bodyLeanDeg?: number;
}

export interface PoseDef {
  id: Pose;
  label: string;
  /** What the held state communicates (Appendix B "reads as"). */
  readsAs: string;
  /**
   * Presence channels (CONTRACT §5.8) that shape how the Director blocks this
   * pose's beat — the tool ships the coupling, the sim applies it.
   */
  presenceChannels: string[];
  transforms?: PoseTransforms;
  facings: Record<Facing, PoseVariant>;
}

const ARM_W = 11;
const arm = (d: string): ShapeSpec => ({ d, stroke: '$outfitPrimary', strokeWidth: ARM_W });
const hand = (x: number, y: number): ShapeSpec => ({ d: circle(x, y, 4.5), fill: '$skin' });

/** Arms hanging at the sides — the base state every beat returns to. */
const NEUTRAL_SOUTH: PoseVariant = {
  front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 26 -21 Q 31 -6 29 10'), hand(29, 13)],
};
const NEUTRAL_EAST: PoseVariant = {
  front: [arm('M 5 -21 Q 9 -6 7 10'), hand(7, 13)],
};

/** Shared swing art for both walk poses — approach vs. away is Director blocking. */
const WALK_SOUTH: PoseVariant = {
  front: [arm('M -26 -21 Q -33 -6 -27 8'), hand(-27, 11), arm('M 26 -21 Q 30 -4 33 10'), hand(33, 13)],
};
const WALK_EAST: PoseVariant = {
  front: [arm('M 5 -21 Q 16 -8 14 6'), hand(15, 9)],
  back: [arm('M -2 -21 Q -14 -8 -11 6'), hand(-11, 9)],
};

export const POSE_DEFS: Record<Pose, PoseDef> = {
  neutral: {
    id: 'neutral',
    label: 'Neutral',
    readsAs: 'idle',
    presenceChannels: ['restlessness'],
    facings: { south: NEUTRAL_SOUTH, east: NEUTRAL_EAST, north: NEUTRAL_SOUTH },
  },

  'walk-approach': {
    id: 'walk-approach',
    label: 'Walk (approach)',
    readsAs: 'purposeful advance',
    presenceChannels: ['gaitSpeed'],
    transforms: { bodyLeanDeg: 6 },
    facings: { south: WALK_SOUTH, east: WALK_EAST, north: WALK_SOUTH },
  },

  notice: {
    id: 'notice',
    label: 'Notice',
    readsAs: 'registering (the anticipation beat)',
    presenceChannels: ['attentiveness'],
    transforms: { headTiltDeg: 9 },
    facings: { south: NEUTRAL_SOUTH, east: NEUTRAL_EAST, north: NEUTRAL_SOUTH },
  },

  'arms-crossed': {
    id: 'arms-crossed',
    label: 'Arms crossed',
    readsAs: 'guard / authority',
    presenceChannels: ['proximityRange'],
    facings: {
      // Forearms barred across the chest; hands tucked, so no skin dots.
      south: { front: [arm('M -26 -21 Q -20 -10 12 -6'), arm('M 26 -21 Q 20 -10 -12 -6')] },
      east: { front: [arm('M 2 -20 Q -7 -13 7 -8'), arm('M 6 -21 Q 16 -10 0 -5')] },
      // From behind only the out-turned elbows read.
      north: { front: [arm('M -26 -18 Q -33 -12 -28 -5'), arm('M 26 -18 Q 33 -12 28 -5')] },
    },
  },

  'hands-on-hips': {
    id: 'hands-on-hips',
    label: 'Hands on hips',
    readsAs: 'looming / dominance (akimbo)',
    presenceChannels: ['proximityRange', 'expressiveness'],
    facings: {
      south: {
        front: [arm('M -26 -21 Q -41 -9 -20 4'), hand(-19, 4), arm('M 26 -21 Q 41 -9 20 4'), hand(19, 4)],
      },
      east: {
        front: [arm('M 5 -21 Q 21 -10 5 4'), hand(5, 4)],
        back: [arm('M -1 -21 Q -15 -11 -3 2')],
      },
      north: {
        front: [arm('M -26 -21 Q -41 -9 -20 4'), hand(-19, 4), arm('M 26 -21 Q 41 -9 20 4'), hand(19, 4)],
      },
    },
  },

  point: {
    id: 'point',
    label: 'Point',
    readsAs: 'the accusation (key beat)',
    presenceChannels: ['expressiveness'],
    facings: {
      // South/north point off to the viewer's right; the Director orients the
      // agent so the extended arm faces the target (west = mirrored east).
      south: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 25 -19 L 49 -26'), hand(52, -27)] },
      east: {
        front: [arm('M 5 -20 L 42 -27'), hand(45, -28)],
        back: [arm('M -2 -21 Q -6 -8 -4 8')],
      },
      north: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 25 -19 L 49 -26'), hand(52, -27)] },
    },
  },

  slump: {
    id: 'slump',
    label: 'Slump',
    readsAs: 'submission / withdrawal',
    presenceChannels: ['commitment', 'latency', 'postureSlump'],
    transforms: { headDropY: 7, headTiltDeg: 6 },
    facings: {
      south: { front: [arm('M -24 -17 Q -26 0 -20 12'), hand(-20, 15), arm('M 24 -17 Q 26 0 20 12'), hand(20, 15)] },
      east: { front: [arm('M 4 -17 Q 8 0 3 12'), hand(3, 15)] },
      north: { front: [arm('M -24 -17 Q -26 0 -20 12'), hand(-20, 15), arm('M 24 -17 Q 26 0 20 12'), hand(20, 15)] },
    },
  },

  'walk-away': {
    id: 'walk-away',
    label: 'Walk (away)',
    readsAs: 'exit (clipped or lingering — presence decides)',
    presenceChannels: ['gaitSpeed', 'restlessness'],
    transforms: { bodyLeanDeg: -4 },
    facings: { south: WALK_SOUTH, east: WALK_EAST, north: WALK_SOUTH },
  },
};

export function getPose(id: string): PoseDef | undefined {
  return POSE_DEFS[id as Pose];
}

/**
 * The exported vocabulary artifact (`pose-catalog.json`, CONTRACT §3.16) — the
 * beat-schedule contract's tool half. Ships ids + reads-as + presence couplings
 * + transform hints; contains NO sequencing (beat schedules, dwell times and
 * blocking are the Director's, sim-side). Art travels separately in each
 * character's poses sheet, keyed `<pose>_<facing>`.
 */
export function poseCatalogJson() {
  return {
    kind: 'pose-catalog' as const,
    generator: 'sprite-character-creator',
    schema: 'social-theater-presentation-experiment.md#appendix-b',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    boundary: {
      tool: 'pose vocabulary + presence couplings + transform hints (this file) + posed frames (per-character poses atlas)',
      director: 'beat schedules, dwell times, blocking, orientation — sequencing is sim-side',
      renderer: 'pose · orientation · hold · move — nothing else',
    },
    poses: POSES.map((id) => {
      const def = POSE_DEFS[id];
      return {
        id: def.id,
        label: def.label,
        readsAs: def.readsAs,
        presenceChannels: def.presenceChannels,
        transforms: def.transforms ?? {},
      };
    }),
    meta: {
      note:
        'A pose is a sim-selected held STATE (register: truth). The renderer only ever draws ' +
        'the named pose; nothing between beats is drawn. Transforms are group transforms ' +
        '(lerpable posture), not frame animation. Unknown pose ids fall back to neutral.',
    },
  };
}
