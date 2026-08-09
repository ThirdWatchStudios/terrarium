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

export const CANONICAL_PIXIE_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalPixieHeadId = CanonicalHairHeadId;

export const CANONICAL_PIXIE_CAP_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -18, center: -1, high: 5 },
  },
  east: {
    x: { low: -22, center: -2, high: 15 },
    y: { low: -22, center: 0, high: 4 },
  },
  north: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -18, center: 4, high: 11 },
  },
};

export const CANONICAL_PIXIE_TUFT_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairComponentFrame>
> = {
  south: { centerX: -24, centerY: 0, radiusX: 3, radiusY: 5 },
  east: { centerX: -21, centerY: 5, radiusX: 6, radiusY: 7 },
  north: { centerX: 24, centerY: 2.5, radiusX: 3, radiusY: 4.5 },
};

export function canonicalPixieCapTargetFrame(
  headId: CanonicalPixieHeadId,
  facing: Facing,
): CanonicalHairFitFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    const half = envelope.southHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY + 3, center: -1, high: 5 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 1;
    return {
      x: { low: -half, center: 0, high: half },
      y: { low: envelope.crownY + 3, center: 4, high: 11 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 1,
      center: -2,
      high: envelope.eastFront + 1,
    },
    y: { low: envelope.crownY - 1, center: 0, high: 4 },
  };
}

export function canonicalPixieTuftTargetFrame(
  headId: CanonicalPixieHeadId,
  facing: Facing,
): CanonicalHairComponentFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    return {
      centerX: -(envelope.southHalf + 3),
      centerY: 0,
      radiusX: 3,
      radiusY: 5,
    };
  }
  if (facing === 'north') {
    return {
      centerX: envelope.northHalf + 3,
      centerY: 2.5,
      radiusX: 3,
      radiusY: 4.5,
    };
  }
  return {
    centerX: envelope.eastBack,
    centerY: 5,
    radiusX: 6,
    radiusY: 7,
  };
}

export function fitCanonicalPixieShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalPixieHeadId,
  facing: Facing,
): ShapeSpec[] {
  const capShapeCount = facing === 'north' ? 1 : 2;
  if (sourceShapes.length !== capShapeCount + 1) {
    throw new Error(
      `Canonical Pixie ${facing} must contain ${capShapeCount} cap/fringe shape(s) and one tuft`,
    );
  }
  return [
    ...fitCanonicalHairShapes(
      sourceShapes.slice(0, capShapeCount),
      CANONICAL_PIXIE_CAP_SOURCE_FRAMES[facing],
      canonicalPixieCapTargetFrame(headId, facing),
    ),
    fitCanonicalHairComponent(
      sourceShapes[capShapeCount],
      CANONICAL_PIXIE_TUFT_SOURCE_FRAMES[facing],
      canonicalPixieTuftTargetFrame(headId, facing),
    ),
  ];
}

export function fitCanonicalPixieVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalPixieHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalPixieShapes(sourceVariant.shapes, headId, facing),
  };
}
