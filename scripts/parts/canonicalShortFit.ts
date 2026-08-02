import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairShapes,
  fitCanonicalHairVariant,
  type CanonicalHairFitFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_SHORT_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalShortHeadId = CanonicalHairHeadId;

/** Geometric landmarks in the three review-source Short SVG facings. */
export const CANONICAL_SHORT_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -20, center: -3, high: 7 },
  },
  east: {
    x: { low: -22, center: -2, high: 14 },
    y: { low: -22, center: -1, high: 6 },
  },
  north: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -20, center: 3, high: 7 },
  },
};

/**
 * Review-only Short fit. The SVG paths are retained; these frames only map
 * their crown, hairline, width, and profile back to accepted head landmarks.
 */
export function canonicalShortTargetFrame(
  headId: CanonicalShortHeadId,
  facing: Facing,
): CanonicalHairFitFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    const half = envelope.southHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY + 1, center: -3, high: 7 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY + 1, center: 3, high: 7 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 1,
      center: -2,
      high: envelope.eastFront,
    },
    y: { low: envelope.crownY - 1, center: -1, high: 6 },
  };
}

export function fitCanonicalShortShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalShortHeadId,
  facing: Facing,
): ShapeSpec[] {
  return fitCanonicalHairShapes(
    sourceShapes,
    CANONICAL_SHORT_SOURCE_FRAMES[facing],
    canonicalShortTargetFrame(headId, facing),
  );
}

export function fitCanonicalShortVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalShortHeadId,
  facing: Facing,
): PartVariant {
  return fitCanonicalHairVariant(
    sourceVariant,
    CANONICAL_SHORT_SOURCE_FRAMES[facing],
    canonicalShortTargetFrame(headId, facing),
  );
}
