import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  fitCanonicalHairShapes,
  fitCanonicalHairVariant,
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  type CanonicalHairFitFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_BOB_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;

export type CanonicalBobHeadId = CanonicalHairHeadId;

export type CanonicalBobFitFrame = CanonicalHairFitFrame;

/**
 * Landmarks in the three checked-in Bob SVGs. Geometry between landmarks is
 * retained and warped piecewise-linearly; the fitter never redraws a Bob path.
 */
export const CANONICAL_BOB_SOURCE_FRAMES: Readonly<Record<Facing, CanonicalBobFitFrame>> = {
  south: {
    x: { low: -23, center: 0, high: 23 },
    y: { low: -27, center: -4, high: 14 },
  },
  east: {
    x: { low: -23, center: 0, high: 23 },
    y: { low: -27, center: -4, high: 14 },
  },
  north: {
    x: { low: -23, center: 0, high: 23 },
    y: { low: -27, center: -4, high: 16 },
  },
};

/**
 * The accepted head envelopes, expressed as declarative fit data. These are
 * the only per-head values in the proof; all visible paths come from Bob SVGs.
 */
export const CANONICAL_BOB_HEAD_ENVELOPES = CANONICAL_HAIR_HEAD_ENVELOPES;

export function canonicalBobTargetFrame(
  headId: CanonicalBobHeadId,
  facing: Facing,
): CanonicalBobFitFrame {
  const envelope = CANONICAL_BOB_HEAD_ENVELOPES[headId];
  const crown = envelope.crownY - 2;
  if (facing === 'south') {
    const half = envelope.southHalf + 3;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: crown, center: -4, high: 23 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 3;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: crown, center: -4, high: 22 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 3,
      center: -2,
      high: envelope.eastFront + 1,
    },
    y: { low: crown, center: -4, high: 18 },
  };
}

export function fitCanonicalBobShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalBobHeadId,
  facing: Facing,
): ShapeSpec[] {
  const source = CANONICAL_BOB_SOURCE_FRAMES[facing];
  const target = canonicalBobTargetFrame(headId, facing);
  return fitCanonicalHairShapes(sourceShapes, source, target);
}

export function fitCanonicalBobVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalBobHeadId,
  facing: Facing,
): PartVariant {
  return fitCanonicalHairVariant(
    sourceVariant,
    CANONICAL_BOB_SOURCE_FRAMES[facing],
    canonicalBobTargetFrame(headId, facing),
  );
}
