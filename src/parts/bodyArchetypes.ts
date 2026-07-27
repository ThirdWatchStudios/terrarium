import type {
  BodyAnchorPoint,
  BodyAnchors,
  BodyAnchorSpan,
  BodyFacingAnchors,
  PartDef,
  PartVariant,
  ShapeSpec,
} from '../core/types';
import { ellipse } from '../core/geometry';

/**
 * Production body archetypes for authoring and deterministic generation.
 *
 * Each body owns the anchors that drive the compositor's head stack, portraits,
 * badges, fitted outfits, all 15 poses, and pose-aware wrist/carry placement.
 * Dress is mechanically compatible but remains visually provisional pending a
 * dedicated art pass.
 */

export type BodyArchetypeId =
  | 'body-compact'
  | 'body-balanced'
  | 'body-large-frame'
  | 'body-tall'
  | 'body-soft'
  | 'body-pinch';

export interface BodyArchetype {
  id: BodyArchetypeId;
  label: string;
  intent: string;
  part: PartDef;
  anchors: BodyAnchors;
}

const point = (x: number, y: number): BodyAnchorPoint => ({ x, y });
const span = (lx: number, ly: number, rx: number, ry: number): BodyAnchorSpan => ({
  left: point(lx, ly),
  right: point(rx, ry),
});

function facingAnchors(
  headX: number,
  headY: number,
  neckX: number,
  neckY: number,
  chestX: number,
  chestY: number,
  hipX: number,
  hipY: number,
  shoulders: BodyAnchorSpan,
  waist: BodyAnchorSpan,
  hem: BodyAnchorSpan,
): BodyFacingAnchors {
  return {
    headCenter: point(headX, headY),
    aboveHead: point(headX, headY - 32),
    neck: point(neckX, neckY),
    chest: point(chestX, chestY),
    hip: point(hipX, hipY),
    shoulders,
    waist,
    hem,
  };
}

const silhouette = (d: string): ShapeSpec => ({ d, fill: '$outfitPrimary' });
const lowerPlane = (rx: number): ShapeSpec => ({
  d: ellipse(0, 20, rx, 7),
  fill: '#00000012',
  silhouette: false,
});

function variant(d: string, lowerPlaneRadius?: number): PartVariant {
  return {
    z: 10,
    shapes: lowerPlaneRadius === undefined ? [silhouette(d)] : [silhouette(d), lowerPlane(lowerPlaneRadius)],
  };
}

function bodyPart(
  id: BodyArchetypeId,
  label: string,
  south: string,
  east: string,
  north: string = south,
  southShade = 16,
  eastShade = 11,
): PartDef {
  return {
    id,
    label,
    slot: 'body',
    anchor: 'body',
    facings: {
      south: variant(south, southShade),
      east: variant(east, eastShade),
      north: variant(north),
    },
  };
}

const COMPACT_SOUTH =
  'M -18 -29 H 18 Q 28 -29 31 -21 L 30 21 Q 29 30 18 30 H -18 Q -29 30 -30 21 L -31 -21 Q -28 -29 -18 -29 Z';
const COMPACT_EAST =
  'M -15 -29 H 14 Q 23 -28 25 -20 L 25 21 Q 23 30 13 30 H -14 Q -23 29 -23 20 L -24 -20 Q -22 -27 -15 -29 Z';

const BALANCED_SOUTH =
  'M -13 -29 Q 0 -33 13 -29 Q 24 -26 27 -16 Q 35 -3 32 13 Q 30 26 19 29 Q 9 32 0 29 Q -9 32 -19 29 Q -30 26 -32 13 Q -35 -3 -27 -16 Q -24 -26 -13 -29 Z';
const BALANCED_EAST =
  'M -10 -29 Q 1 -33 12 -29 Q 23 -25 26 -14 Q 32 0 29 14 Q 27 26 17 29 Q 6 32 -4 29 Q -16 29 -20 20 Q -25 7 -22 -7 Q -21 -23 -10 -29 Z';

const LARGE_FRAME_SOUTH =
  'M 0 -33 Q -18 -34 -35 -23 Q -38 -20 -34 -14 L -19 22 Q -16 30 -9 30 H 9 Q 16 30 19 22 L 34 -14 Q 38 -20 35 -23 Q 18 -34 0 -33 Z';
const LARGE_FRAME_EAST =
  'M -5 -32 Q 5 -35 16 -31 L 29 -22 Q 32 -19 29 -13 L 16 22 Q 13 30 5 30 H -9 Q -17 29 -16 21 L -20 -17 Q -18 -27 -5 -32 Z';

const TALL_SOUTH =
  'M -12 -34 Q 0 -38 12 -34 Q 18 -31 19 -23 L 18 19 Q 18 29 9 30 H -9 Q -18 29 -18 19 L -19 -23 Q -18 -31 -12 -34 Z';
const TALL_EAST =
  'M -9 -34 Q 1 -38 11 -34 Q 17 -31 18 -23 L 18 19 Q 16 29 7 30 H -7 Q -14 28 -15 19 L -15 -23 Q -14 -31 -9 -34 Z';

const SOFT_SOUTH =
  'M -10 -28 Q 0 -32 10 -28 Q 20 -25 21 -16 Q 21 -5 27 6 L 34 20 Q 36 28 24 30 H -24 Q -36 28 -34 20 L -27 6 Q -21 -5 -21 -16 Q -20 -25 -10 -28 Z';
const SOFT_EAST =
  'M -8 -28 Q 1 -32 10 -28 Q 19 -24 20 -15 Q 21 -3 27 9 L 31 20 Q 33 29 21 30 H -17 Q -29 28 -27 19 L -21 7 Q -18 -4 -18 -16 Q -17 -25 -8 -28 Z';

const PINCH_SOUTH =
  'M -11 -29 Q 0 -33 11 -29 C 20 -27 24 -24 25 -18 C 26 -11 22 -7 20 -3 C 18 1 19 6 22 10 C 25 14 29 16 31 21 C 33 26 29 30 22 30 H -22 C -29 30 -33 26 -31 21 C -29 16 -25 14 -22 10 C -19 6 -18 1 -20 -3 C -22 -7 -26 -11 -25 -18 C -24 -24 -20 -27 -11 -29 Z';
const PINCH_EAST =
  'M -9 -29 Q 1 -33 11 -29 C 19 -26 22 -23 22 -17 C 23 -11 20 -7 18 -3 C 17 1 18 6 21 10 C 24 14 29 17 30 21 C 32 26 28 30 20 30 H -17 C -24 30 -28 26 -26 21 C -24 17 -20 14 -18 10 C -16 6 -16 1 -18 -3 C -21 -8 -22 -12 -20 -18 C -18 -25 -15 -27 -9 -29 Z';

const compactSouthAnchors = facingAnchors(
  0, -55, 0, -29, 0, -5, 0, 14,
  span(-29, -20, 29, -20), span(-29, 5, 29, 5), span(-23, 25, 23, 25),
);
const compactEastAnchors = facingAnchors(
  3, -55, 0, -29, 2, -5, 2, 14,
  span(-4, -20, 7, -20), span(-22, 5, 24, 5), span(-17, 25, 19, 25),
);

const balancedSouthAnchors = facingAnchors(
  0, -58, 0, -29, 0, -5, 0, 14,
  span(-25, -18, 25, -18), span(-31, 4, 31, 4), span(-21, 25, 21, 25),
);
const balancedEastAnchors = facingAnchors(
  3, -58, 0, -29, 3, -5, 3, 14,
  span(-3, -18, 7, -18), span(-21, 4, 27, 4), span(-14, 25, 18, 25),
);

const largeFrameSouthAnchors = facingAnchors(
  0, -60, 0, -32, 0, -8, 0, 13,
  span(-33, -21, 33, -21), span(-24, 3, 24, 3), span(-12, 25, 12, 25),
);
const largeFrameEastAnchors = facingAnchors(
  3, -60, 0, -32, 3, -8, 3, 13,
  span(-4, -21, 8, -21), span(-17, 3, 22, 3), span(-10, 25, 13, 25),
);

const tallSouthAnchors = facingAnchors(
  0, -62, 0, -34, 0, -9, 0, 13,
  span(-18, -24, 18, -24), span(-17, 4, 17, 4), span(-10, 25, 10, 25),
);
const tallEastAnchors = facingAnchors(
  2, -62, 0, -34, 1, -9, 1, 13,
  span(-2, -24, 4, -24), span(-14, 4, 16, 4), span(-8, 25, 10, 25),
);

const softSouthAnchors = facingAnchors(
  0, -57, 0, -28, 0, -4, 0, 15,
  span(-20, -17, 20, -17), span(-28, 7, 28, 7), span(-28, 25, 28, 25),
);
const softEastAnchors = facingAnchors(
  3, -57, 0, -28, 3, -4, 3, 15,
  span(-3, -17, 6, -17), span(-20, 7, 27, 7), span(-18, 25, 23, 25),
);

const pinchSouthAnchors = facingAnchors(
  0, -58, 0, -29, 0, -6, 0, 11,
  span(-20, -18, 20, -18), span(-19, 4, 19, 4), span(-29, 25, 29, 25),
);
const pinchEastAnchors = facingAnchors(
  3, -58, 0, -29, 3, -6, 3, 12,
  span(-3, -18, 7, -18), span(-17, 4, 20, 4), span(-24, 25, 28, 25),
);

const compactAnchors: BodyAnchors = { south: compactSouthAnchors, east: compactEastAnchors, north: compactSouthAnchors };
const balancedAnchors: BodyAnchors = { south: balancedSouthAnchors, east: balancedEastAnchors, north: balancedSouthAnchors };
const largeFrameAnchors: BodyAnchors = { south: largeFrameSouthAnchors, east: largeFrameEastAnchors, north: largeFrameSouthAnchors };
const tallAnchors: BodyAnchors = { south: tallSouthAnchors, east: tallEastAnchors, north: tallSouthAnchors };
const softAnchors: BodyAnchors = { south: softSouthAnchors, east: softEastAnchors, north: softSouthAnchors };
const pinchAnchors: BodyAnchors = { south: pinchSouthAnchors, east: pinchEastAnchors, north: pinchSouthAnchors };

export const BODY_ARCHETYPES: BodyArchetype[] = [
  {
    id: 'body-compact',
    label: 'Block',
    intent: 'Flat shoulder shelf and broad base create a low, rectangular weight.',
    part: { ...bodyPart('body-compact', 'Block', COMPACT_SOUTH, COMPACT_EAST, COMPACT_SOUTH, 23, 17), bodyAnchors: compactAnchors },
    anchors: compactAnchors,
  },
  {
    id: 'body-balanced',
    label: 'Barrel',
    intent: 'Full middle with a pinched shoulder and base instead of a neutral capsule.',
    part: { ...bodyPart('body-balanced', 'Barrel', BALANCED_SOUTH, BALANCED_EAST, BALANCED_SOUTH, 21, 14), bodyAnchors: balancedAnchors },
    anchors: balancedAnchors,
  },
  {
    id: 'body-large-frame',
    label: 'Wedge',
    intent: 'Wide shoulder slope converges into a deliberately narrow base.',
    part: { ...bodyPart('body-large-frame', 'Wedge', LARGE_FRAME_SOUTH, LARGE_FRAME_EAST, LARGE_FRAME_SOUTH, 12, 10), bodyAnchors: largeFrameAnchors },
    anchors: largeFrameAnchors,
  },
  {
    id: 'body-tall',
    label: 'Column',
    intent: 'Near-parallel flanks and a tight base create a continuous narrow hull.',
    part: { ...bodyPart('body-tall', 'Column', TALL_SOUTH, TALL_EAST, TALL_SOUTH, 10, 8), bodyAnchors: tallAnchors },
    anchors: tallAnchors,
  },
  {
    id: 'body-soft',
    label: 'Bell',
    intent: 'Small shoulder opening grows into a lower, outward mass without assigning gender.',
    part: { ...bodyPart('body-soft', 'Bell', SOFT_SOUTH, SOFT_EAST, SOFT_SOUTH, 28, 18), bodyAnchors: softAnchors },
    anchors: softAnchors,
  },
  {
    id: 'body-pinch',
    label: 'Pinch',
    intent: 'Moderate shoulders, a shallow waist, and rounded hips create a distinct double rhythm.',
    part: { ...bodyPart('body-pinch', 'Pinch', PINCH_SOUTH, PINCH_EAST, PINCH_SOUTH, 29, 24), bodyAnchors: pinchAnchors },
    anchors: pinchAnchors,
  },
];

export const BODY_ARCHETYPE_PARTS: PartDef[] = BODY_ARCHETYPES.map((archetype) => archetype.part);
