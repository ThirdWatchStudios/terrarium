import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairComponent,
  fitCanonicalHairShapes,
  type CanonicalHairComponentFrame,
  type CanonicalHairFitFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_BUN_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalBunHeadId = CanonicalHairHeadId;

export const CANONICAL_BUN_CAP_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -22, center: -4, high: 1 },
  },
  east: {
    x: { low: -22, center: -2, high: 14 },
    y: { low: -22, center: -1, high: 7 },
  },
  north: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -22, center: 4, high: 9 },
  },
};

export const CANONICAL_BUN_KNOT_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairComponentFrame>
> = {
  south: { centerX: -13.7, centerY: -18, radiusX: 6.7, radiusY: 5.5 },
  east: { centerX: -21, centerY: -18, radiusX: 6, radiusY: 5.5 },
  north: { centerX: 13.7, centerY: -18, radiusX: 6.7, radiusY: 5.5 },
};

export function canonicalBunCapTargetFrame(
  headId: CanonicalBunHeadId,
  facing: Facing,
): CanonicalHairFitFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    const half = envelope.southHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY - 1, center: -4, high: 1 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY - 1, center: 4, high: 9 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 1,
      center: -2,
      high: envelope.eastFront,
    },
    y: { low: envelope.crownY - 1, center: -1, high: 7 },
  };
}

export function canonicalBunKnotTargetFrame(
  headId: CanonicalBunHeadId,
  facing: Facing,
): CanonicalHairComponentFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  const radiusX = Math.max(6, Number((envelope.southHalf * 0.32).toFixed(1)));
  const centerY = Number((envelope.crownY + 3).toFixed(1));
  if (facing === 'south') {
    return {
      centerX: Number((-envelope.southHalf * 0.65).toFixed(1)),
      centerY,
      radiusX,
      radiusY: 5.5,
    };
  }
  if (facing === 'north') {
    return {
      centerX: Number((envelope.northHalf * 0.65).toFixed(1)),
      centerY,
      radiusX,
      radiusY: 5.5,
    };
  }
  return {
    centerX: envelope.eastBack,
    centerY,
    radiusX: Math.max(6, radiusX * 0.85),
    radiusY: 5.5,
  };
}

export function fitCanonicalBunShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalBunHeadId,
  facing: Facing,
): ShapeSpec[] {
  if (sourceShapes.length !== 2) {
    throw new Error(`Canonical Bun ${facing} must contain cap and knot shapes`);
  }
  return [
    ...fitCanonicalHairShapes(
      [sourceShapes[0]],
      CANONICAL_BUN_CAP_SOURCE_FRAMES[facing],
      canonicalBunCapTargetFrame(headId, facing),
    ),
    fitCanonicalHairComponent(
      sourceShapes[1],
      CANONICAL_BUN_KNOT_SOURCE_FRAMES[facing],
      canonicalBunKnotTargetFrame(headId, facing),
    ),
  ];
}

export function fitCanonicalBunVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalBunHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalBunShapes(sourceVariant.shapes, headId, facing),
  };
}
