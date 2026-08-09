import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairShapes,
  fitCanonicalHairVariant,
  type CanonicalHairFitFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_LONG_STRAIGHT_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalLongStraightHeadId = CanonicalHairHeadId;

/** Geometric landmarks in the three review-source Long straight SVG facings. */
export const CANONICAL_LONG_STRAIGHT_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -24, center: 0, high: 24 },
    y: { low: -23, center: -4, high: 30 },
  },
  east: {
    x: { low: -24, center: -2, high: 15 },
    y: { low: -23, center: -5, high: 30 },
  },
  north: {
    x: { low: -24, center: 0, high: 24 },
    y: { low: -23, center: -4, high: 31 },
  },
};

export function canonicalLongStraightTargetFrame(
  headId: CanonicalLongStraightHeadId,
  facing: Facing,
): CanonicalHairFitFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    const half = envelope.southHalf + 3;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY - 2, center: -4, high: 30 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 3;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY - 2, center: -4, high: 31 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 3,
      center: -2,
      high: envelope.eastFront + 1,
    },
    y: { low: envelope.crownY - 2, center: -5, high: 30 },
  };
}

export function fitCanonicalLongStraightShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalLongStraightHeadId,
  facing: Facing,
): ShapeSpec[] {
  return fitCanonicalHairShapes(
    sourceShapes,
    CANONICAL_LONG_STRAIGHT_SOURCE_FRAMES[facing],
    canonicalLongStraightTargetFrame(headId, facing),
  );
}

export function fitCanonicalLongStraightVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalLongStraightHeadId,
  facing: Facing,
): PartVariant {
  return fitCanonicalHairVariant(
    sourceVariant,
    CANONICAL_LONG_STRAIGHT_SOURCE_FRAMES[facing],
    canonicalLongStraightTargetFrame(headId, facing),
  );
}
