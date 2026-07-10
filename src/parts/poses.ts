import type { BodyAnchorPoint, BodyFacingAnchors, Facing, ShapeSpec } from '../core/types';
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
  // Confrontation set (Appendix B) — the reprimand/snap.
  | 'neutral'
  | 'walk-approach'
  | 'notice'
  | 'arms-crossed'
  | 'hands-on-hips'
  | 'point'
  | 'slump'
  | 'walk-away'
  // Composition set — gossip huddle, warmth, three-way, resource friction, fallout.
  | 'lean-in'
  | 'glance-back'
  | 'laugh'
  | 'shrug'
  | 'recoil'
  | 'celebrate'
  | 'console';

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
  'lean-in',
  'glance-back',
  'laugh',
  'shrug',
  'recoil',
  'celebrate',
  'console',
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

const curveArm = (start: BodyAnchorPoint, control: BodyAnchorPoint, end: BodyAnchorPoint): ShapeSpec =>
  arm(`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`);
const lineArm = (start: BodyAnchorPoint, end: BodyAnchorPoint): ShapeSpec =>
  arm(`M ${start.x} ${start.y} L ${end.x} ${end.y}`);
const clamp = (min: number, max: number, value: number): number => Math.max(min, Math.min(max, value));
const between = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Representative pose art generated from a body's own shoulder/waist/hip rig. */
function anchoredNeutral(facing: Facing, body: BodyFacingAnchors): PoseVariant {
  if (facing === 'east') {
    const start = body.shoulders.right;
    const handCenter = { x: start.x + 3, y: body.hip.y };
    const end = { x: handCenter.x, y: handCenter.y - 3 };
    const control = { x: start.x + 4, y: (start.y + end.y) / 2 };
    return { front: [curveArm(start, control, end), hand(handCenter.x, handCenter.y)] };
  }
  const leftStart = body.shoulders.left;
  const rightStart = body.shoulders.right;
  const leftHand = { x: leftStart.x - 3, y: body.hip.y };
  const rightHand = { x: rightStart.x + 3, y: body.hip.y };
  const leftEnd = { x: leftHand.x, y: leftHand.y - 3 };
  const rightEnd = { x: rightHand.x, y: rightHand.y - 3 };
  return {
    front: [
      curveArm(leftStart, { x: leftEnd.x - 2, y: (leftStart.y + leftEnd.y) / 2 }, leftEnd),
      hand(leftHand.x, leftHand.y),
      curveArm(rightStart, { x: rightEnd.x + 2, y: (rightStart.y + rightEnd.y) / 2 }, rightEnd),
      hand(rightHand.x, rightHand.y),
    ],
  };
}

function anchoredPoint(facing: Facing, body: BodyFacingAnchors): PoseVariant {
  if (facing === 'east') {
    const frontStart = body.shoulders.right;
    const reach = clamp(21, 29, body.hip.y - frontStart.y - 8) + 14;
    const handCenter = {
      x: Math.min(55, frontStart.x + reach + 3),
      y: frontStart.y - 8,
    };
    const frontEnd = { x: handCenter.x - 3, y: handCenter.y + 1 };
    const backStart = body.shoulders.left;
    const backEnd = { x: backStart.x - 2, y: body.hip.y - 5 };
    return {
      front: [lineArm(frontStart, frontEnd), hand(handCenter.x, handCenter.y)],
      back: [curveArm(backStart, { x: backStart.x - 4, y: (backStart.y + backEnd.y) / 2 }, backEnd)],
    };
  }
  const leftStart = body.shoulders.left;
  const leftHand = { x: leftStart.x - 3, y: body.hip.y };
  const leftEnd = { x: leftHand.x, y: leftHand.y - 3 };
  const rightStart = body.shoulders.right;
  const reach = clamp(21, 29, body.hip.y - rightStart.y - 8);
  const rightHand = {
    x: Math.min(55, rightStart.x + reach + 3),
    y: rightStart.y - 8,
  };
  const rightEnd = { x: rightHand.x - 3, y: rightHand.y + 1 };
  return {
    front: [
      curveArm(leftStart, { x: leftEnd.x - 2, y: (leftStart.y + leftEnd.y) / 2 }, leftEnd),
      hand(leftHand.x, leftHand.y),
      lineArm(rightStart, rightEnd),
      hand(rightHand.x, rightHand.y),
    ],
  };
}

function anchoredSlump(facing: Facing, body: BodyFacingAnchors): PoseVariant {
  if (facing === 'east') {
    const start = { x: body.shoulders.right.x - 2, y: body.shoulders.right.y + 4 };
    const handCenter = { x: body.shoulders.right.x - 6, y: body.hip.y + 2 };
    const end = { x: handCenter.x, y: handCenter.y - 3 };
    return {
      front: [
        curveArm(start, { x: between(start.x, end.x, 0.55) + 2, y: between(start.y, end.y, 0.586) }, end),
        hand(handCenter.x, handCenter.y),
      ],
    };
  }
  const leftStart = { x: body.shoulders.left.x + 2, y: body.shoulders.left.y + 4 };
  const rightStart = { x: body.shoulders.right.x - 2, y: body.shoulders.right.y + 4 };
  const leftHand = { x: body.shoulders.left.x + 6, y: body.hip.y + 2 };
  const rightHand = { x: body.shoulders.right.x - 6, y: body.hip.y + 2 };
  const leftEnd = { x: leftHand.x, y: leftHand.y - 3 };
  const rightEnd = { x: rightHand.x, y: rightHand.y - 3 };
  return {
    front: [
      curveArm(leftStart, { x: between(leftStart.x, leftEnd.x, 0.55) - 1, y: between(leftStart.y, leftEnd.y, 0.586) }, leftEnd),
      hand(leftHand.x, leftHand.y),
      curveArm(rightStart, { x: between(rightStart.x, rightEnd.x, 0.55) + 1, y: between(rightStart.y, rightEnd.y, 0.586) }, rightEnd),
      hand(rightHand.x, rightHand.y),
    ],
  };
}

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

  // --- composition set --------------------------------------------------------

  'lean-in': {
    id: 'lean-in',
    label: 'Lean in',
    readsAs: 'sharing a secret (conspiratorial — huddle/gossip)',
    presenceChannels: ['proximityRange', 'attentiveness'],
    transforms: { headTiltDeg: 5 },
    facings: {
      // One hand cupped up near the mouth; the other hangs. The whisper tell.
      south: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 26 -21 Q 34 -30 16 -24'), hand(13, -25)] },
      east: { front: [arm('M 5 -21 Q 13 -30 -3 -24'), hand(-5, -25)], back: [arm('M -2 -21 Q -6 -8 -4 8')] },
      north: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 26 -21 Q 34 -30 16 -24'), hand(13, -25)] },
    },
  },

  'glance-back': {
    id: 'glance-back',
    label: 'Glance back',
    readsAs: 'checking who is watching (secrecy / the excluded look)',
    presenceChannels: ['attentiveness', 'restlessness'],
    transforms: { headTiltDeg: -14 },
    facings: {
      // Arms tucked, shoulders hunched; the head does the work (transform).
      south: { front: [arm('M -26 -20 Q -24 -12 -8 -8'), arm('M 26 -20 Q 24 -12 8 -8')] },
      east: { front: [arm('M 4 -20 Q -2 -12 6 -8')] },
      north: { front: [arm('M -26 -20 Q -24 -12 -8 -8'), arm('M 26 -20 Q 24 -12 8 -8')] },
    },
  },

  laugh: {
    id: 'laugh',
    label: 'Laugh',
    readsAs: 'shared warmth (open laugh — side-by-side)',
    presenceChannels: ['expressiveness'],
    transforms: { headTiltDeg: -9 },
    facings: {
      // Head tossed back (transform); one hand to the belly, the other swung out.
      south: { front: [arm('M -26 -21 Q -35 -8 -31 8'), hand(-32, 10), arm('M 26 -21 Q 29 -6 8 -3'), hand(6, -3)] },
      east: { front: [arm('M 5 -21 Q 7 -6 -4 -3'), hand(-6, -3)] },
      north: { front: [arm('M -26 -21 Q -35 -8 -31 8'), hand(-32, 10), arm('M 26 -21 Q 29 -6 8 -3'), hand(6, -3)] },
    },
  },

  shrug: {
    id: 'shrug',
    label: 'Shrug',
    readsAs: 'deflection / helplessness ("not my problem")',
    presenceChannels: ['commitment', 'expressiveness'],
    facings: {
      // Shoulders up, forearms out, palms open to the sides.
      south: { front: [arm('M -26 -19 Q -36 -16 -34 -3'), hand(-35, -1), arm('M 26 -19 Q 36 -16 34 -3'), hand(35, -1)] },
      east: { front: [arm('M 5 -19 Q 15 -16 13 -3'), hand(14, -1)], back: [arm('M -2 -19 Q -12 -16 -10 -3'), hand(-11, -1)] },
      north: { front: [arm('M -26 -19 Q -36 -16 -34 -3'), hand(-35, -1), arm('M 26 -19 Q 36 -16 34 -3'), hand(35, -1)] },
    },
  },

  recoil: {
    id: 'recoil',
    label: 'Recoil',
    readsAs: 'shock / recoil (taking it hard — exclusion, a snap landing)',
    presenceChannels: ['latency', 'attentiveness'],
    transforms: { bodyLeanDeg: -8, headTiltDeg: -6 },
    facings: {
      // Both forearms thrown up in front, warding off; the body leans away (east).
      south: { front: [arm('M -26 -21 Q -20 -12 -13 -21'), hand(-12, -23), arm('M 26 -21 Q 20 -12 13 -21'), hand(12, -23)] },
      east: { front: [arm('M 5 -21 Q 0 -12 9 -21'), hand(10, -23)] },
      north: { front: [arm('M -26 -21 Q -20 -12 -13 -21'), hand(-12, -23), arm('M 26 -21 Q 20 -12 13 -21'), hand(12, -23)] },
    },
  },

  celebrate: {
    id: 'celebrate',
    label: 'Celebrate',
    readsAs: 'triumph / kudos (arms up)',
    presenceChannels: ['expressiveness'],
    facings: {
      // Both arms flung up and out — the cheer.
      south: { front: [arm('M -26 -21 L -33 -41'), hand(-34, -43), arm('M 26 -21 L 33 -41'), hand(34, -43)] },
      east: { front: [arm('M 5 -21 L 10 -41'), hand(11, -43)], back: [arm('M -2 -21 L -7 -40'), hand(-8, -42)] },
      north: { front: [arm('M -26 -21 L -33 -41'), hand(-34, -43), arm('M 26 -21 L 33 -41'), hand(34, -43)] },
    },
  },

  console: {
    id: 'console',
    label: 'Console',
    readsAs: 'comfort / reaching out (a hand toward another — gentler than point)',
    presenceChannels: ['proximityRange', 'commitment'],
    transforms: { headTiltDeg: 4 },
    facings: {
      // One arm reaches level toward the neighbour (not up like the accusation);
      // the other hangs. The Director orients it toward the comforted party.
      south: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 25 -18 Q 40 -14 47 -6'), hand(49, -4)] },
      east: { front: [arm('M 5 -18 Q 22 -14 40 -8'), hand(42, -7)], back: [arm('M -2 -21 Q -6 -8 -4 8')] },
      north: { front: [arm('M -26 -21 Q -31 -6 -29 10'), hand(-29, 13), arm('M 25 -18 Q 40 -14 47 -6'), hand(49, -4)] },
    },
  },
};

export function getPose(id: string): PoseDef | undefined {
  return POSE_DEFS[id as Pose];
}

/**
 * Resolve pose art for the active body. The three proof poses consume body-owned
 * anchors; every other pose (and every legacy body) retains its existing static
 * geometry until the archetype set is promoted.
 */
export function poseVariantFor(
  id: string,
  facing: Facing,
  bodyAnchors?: BodyFacingAnchors,
): PoseVariant | undefined {
  const pose = getPose(id);
  if (!pose) return undefined;
  if (!bodyAnchors) return pose.facings[facing];
  if (id === 'neutral') return anchoredNeutral(facing, bodyAnchors);
  if (id === 'point') return anchoredPoint(facing, bodyAnchors);
  if (id === 'slump') return anchoredSlump(facing, bodyAnchors);
  return pose.facings[facing];
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
