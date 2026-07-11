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
  | 'body-soft';

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
  'M 0 -24 C -13 -24 -24 -22 -28 -16 C -30 -7 -29 5 -27 14 C -25 23 -19 28 -10 29 C -4 30 4 30 10 29 C 19 28 25 23 27 14 C 29 5 30 -7 28 -16 C 24 -22 13 -24 0 -24 Z';
const COMPACT_EAST =
  'M 0 -24 C -9 -24 -17 -22 -20 -16 C -23 -7 -22 4 -20 14 C -18 23 -12 28 -4 29 C 3 30 10 29 15 26 C 21 22 23 14 22 5 C 23 -4 23 -12 20 -17 C 16 -23 9 -24 0 -24 Z';

const BALANCED_SOUTH =
  'M 0 -29 C -12 -29 -23 -27 -27 -20 C -30 -11 -27 -1 -25 8 C -23 18 -20 26 -11 29 C -4 30 4 30 11 29 C 20 26 23 18 25 8 C 27 -1 30 -11 27 -20 C 23 -27 12 -29 0 -29 Z';
const BALANCED_EAST =
  'M 1 -29 C -8 -29 -16 -26 -18 -19 C -20 -10 -18 2 -17 12 C -16 22 -11 27 -3 29 C 4 30 11 29 15 26 C 20 21 20 13 19 6 C 21 -2 22 -11 20 -17 C 18 -25 11 -29 1 -29 Z';

const LARGE_FRAME_SOUTH =
  'M 0 -30 C -15 -30 -28 -28 -34 -22 C -37 -17 -37 -11 -34 -5 C -32 1 -31 7 -29 12 C -27 21 -22 27 -12 29 C -4 30 4 30 12 29 C 22 27 27 21 29 12 C 31 7 32 1 34 -5 C 37 -11 37 -17 34 -22 C 28 -28 15 -30 0 -30 Z';
const LARGE_FRAME_EAST =
  'M 1 -30 C -10 -30 -20 -28 -23 -21 C -26 -12 -24 -1 -22 9 C -22 19 -17 26 -8 29 C 0 31 9 30 16 27 C 24 23 27 15 25 6 C 27 -3 28 -12 25 -19 C 22 -27 13 -30 1 -30 Z';

const TALL_SOUTH =
  'M 0 -34 C -10 -34 -21 -32 -24 -25 C -27 -16 -24 -4 -22 7 C -20 18 -17 26 -9 29 C -3 30 3 30 9 29 C 17 26 20 18 22 7 C 24 -4 27 -16 24 -25 C 21 -32 10 -34 0 -34 Z';
const TALL_EAST =
  'M 1 -34 C -7 -34 -14 -31 -16 -25 C -19 -16 -17 -4 -16 8 C -15 19 -11 26 -4 29 C 2 30 8 29 12 26 C 17 22 18 15 17 7 C 19 -3 20 -15 18 -23 C 16 -31 10 -34 1 -34 Z';

const SOFT_SOUTH =
  'M 0 -28 C -11 -28 -20 -25 -24 -18 C -27 -10 -27 -1 -30 8 C -33 17 -30 25 -22 28 C -15 31 -6 30 0 29 C 6 30 15 31 22 28 C 30 25 33 17 30 8 C 27 -1 27 -10 24 -18 C 20 -25 11 -28 0 -28 Z';
const SOFT_EAST =
  'M 1 -28 C -9 -28 -18 -25 -20 -18 C -23 -9 -21 0 -23 9 C -25 18 -21 26 -13 29 C -5 31 5 30 12 29 C 22 27 28 19 28 10 C 29 1 26 -7 24 -15 C 22 -23 13 -28 1 -28 Z';

const compactSouthAnchors = facingAnchors(
  0, -38, 0, -24, 0, -5, 0, 13,
  span(-27, -16, 27, -16), span(-26, 4, 26, 4), span(-19, 24, 19, 24),
);
const compactEastAnchors = facingAnchors(
  3, -38, 0, -24, 2, -5, 2, 13,
  span(-3, -16, 6, -16), span(-20, 4, 22, 4), span(-14, 24, 16, 24),
);

const balancedSouthAnchors = facingAnchors(
  0, -43, 0, -29, 0, -7, 0, 13,
  span(-26, -20, 26, -20), span(-25, 4, 25, 4), span(-18, 24, 18, 24),
);
const balancedEastAnchors = facingAnchors(
  3, -43, 0, -29, 2, -7, 2, 13,
  span(-3, -20, 6, -20), span(-17, 4, 19, 4), span(-11, 24, 13, 24),
);

const largeFrameSouthAnchors = facingAnchors(
  0, -44, 0, -30, 0, -7, 0, 13,
  span(-34, -21, 34, -21), span(-31, 4, 31, 4), span(-22, 24, 22, 24),
);
const largeFrameEastAnchors = facingAnchors(
  4, -44, 0, -30, 3, -7, 3, 13,
  span(-5, -21, 8, -21), span(-23, 4, 26, 4), span(-15, 24, 18, 24),
);

const tallSouthAnchors = facingAnchors(
  0, -48, 0, -34, 0, -10, 0, 12,
  span(-23, -25, 23, -25), span(-22, 3, 22, 3), span(-15, 24, 15, 24),
);
const tallEastAnchors = facingAnchors(
  3, -48, 0, -34, 1, -10, 1, 12,
  span(-3, -25, 5, -25), span(-16, 3, 18, 3), span(-10, 24, 12, 24),
);

const softSouthAnchors = facingAnchors(
  0, -42, 0, -28, 0, -6, 0, 14,
  span(-23, -18, 23, -18), span(-30, 8, 30, 8), span(-24, 24, 24, 24),
);
const softEastAnchors = facingAnchors(
  3, -42, 0, -28, 3, -6, 3, 14,
  span(-3, -18, 6, -18), span(-23, 8, 28, 8), span(-15, 24, 20, 24),
);

const compactAnchors: BodyAnchors = { south: compactSouthAnchors, east: compactEastAnchors, north: compactSouthAnchors };
const balancedAnchors: BodyAnchors = { south: balancedSouthAnchors, east: balancedEastAnchors, north: balancedSouthAnchors };
const largeFrameAnchors: BodyAnchors = { south: largeFrameSouthAnchors, east: largeFrameEastAnchors, north: largeFrameSouthAnchors };
const tallAnchors: BodyAnchors = { south: tallSouthAnchors, east: tallEastAnchors, north: tallSouthAnchors };
const softAnchors: BodyAnchors = { south: softSouthAnchors, east: softEastAnchors, north: softSouthAnchors };

export const BODY_ARCHETYPES: BodyArchetype[] = [
  {
    id: 'body-compact',
    label: 'Compact',
    intent: 'Short vertical rhythm, grounded stance, and broad readable shoulders.',
    part: { ...bodyPart('body-compact', 'Compact', COMPACT_SOUTH, COMPACT_EAST, COMPACT_SOUTH, 18, 13), bodyAnchors: compactAnchors },
    anchors: compactAnchors,
  },
  {
    id: 'body-balanced',
    label: 'Balanced',
    intent: 'Neutral control silhouette without treating it as the normative body.',
    part: { ...bodyPart('body-balanced', 'Balanced', BALANCED_SOUTH, BALANCED_EAST, BALANCED_SOUTH, 16, 11), bodyAnchors: balancedAnchors },
    anchors: balancedAnchors,
  },
  {
    id: 'body-large-frame',
    label: 'Large-frame',
    intent: 'Width concentrated at the shoulder line, with a strong taper toward the hem.',
    part: { ...bodyPart('body-large-frame', 'Large-frame', LARGE_FRAME_SOUTH, LARGE_FRAME_EAST, LARGE_FRAME_SOUTH, 20, 15), bodyAnchors: largeFrameAnchors },
    anchors: largeFrameAnchors,
  },
  {
    id: 'body-tall',
    label: 'Tall',
    intent: 'Long, narrow vertical rhythm rather than a stretched balanced capsule.',
    part: { ...bodyPart('body-tall', 'Tall', TALL_SOUTH, TALL_EAST, TALL_SOUTH, 13, 10), bodyAnchors: tallAnchors },
    anchors: tallAnchors,
  },
  {
    id: 'body-soft',
    label: 'Soft',
    intent: 'Sloped shoulders and lower-volume roundness without caricature.',
    part: { ...bodyPart('body-soft', 'Soft', SOFT_SOUTH, SOFT_EAST, SOFT_SOUTH, 21, 16), bodyAnchors: softAnchors },
    anchors: softAnchors,
  },
];

export const BODY_ARCHETYPE_PARTS: PartDef[] = BODY_ARCHETYPES.map((archetype) => archetype.part);
