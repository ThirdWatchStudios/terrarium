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

export const CANONICAL_SIDE_PART_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalSidePartHeadId = CanonicalHairHeadId;

export const CANONICAL_SIDE_PART_CAP_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -23, center: 3, high: 23 },
    y: { low: -22, center: -3, high: 9 },
  },
  east: {
    x: { low: -22, center: -1.7, high: 16 },
    y: { low: -22, center: -3, high: 10 },
  },
  north: {
    x: { low: -23, center: 4, high: 23 },
    y: { low: -22, center: -3, high: 11 },
  },
};

export const CANONICAL_SIDE_PART_MASS_SOURCE_FRAMES: Readonly<
  Partial<Record<Facing, CanonicalHairComponentFrame>>
> = {
  south: { centerX: 20, centerY: 5, radiusX: 5, radiusY: 10 },
  east: { centerX: -23.5, centerY: 7, radiusX: 7.5, radiusY: 10 },
};

export function canonicalSidePartCapTargetFrame(
  headId: CanonicalSidePartHeadId,
  facing: Facing,
): CanonicalHairFitFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    const half = envelope.southHalf + 2;
    return {
      x: { low: -half, center: 3, high: half },
      y: { low: envelope.crownY - 1, center: -3, high: 9 },
    };
  }
  if (facing === 'north') {
    const half = envelope.northHalf + 2;
    return {
      x: { low: -half, center: 4, high: half },
      y: { low: envelope.crownY - 1, center: -3, high: 11 },
    };
  }
  return {
    x: {
      low: envelope.eastBack - 1,
      center: -1.7,
      high: envelope.eastFront + 2,
    },
    y: { low: envelope.crownY - 1, center: -3, high: 10 },
  };
}

export function canonicalSidePartMassTargetFrame(
  headId: CanonicalSidePartHeadId,
  facing: 'south' | 'east',
): CanonicalHairComponentFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    return {
      centerX: envelope.southHalf - 1,
      centerY: 5,
      radiusX: 5,
      radiusY: 10,
    };
  }
  return {
    centerX: envelope.eastBack - 2.5,
    centerY: 7,
    radiusX: 7.5,
    radiusY: 10,
  };
}

export function fitCanonicalSidePartShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalSidePartHeadId,
  facing: Facing,
): ShapeSpec[] {
  const expected = facing === 'north' ? 2 : 3;
  if (sourceShapes.length !== expected) {
    throw new Error(`Canonical Side-part ${facing} must contain ${expected} authored shapes`);
  }
  const detailIndex = sourceShapes.length - 1;
  const [cap, detail] = fitCanonicalHairShapes(
    [sourceShapes[0], sourceShapes[detailIndex]],
    CANONICAL_SIDE_PART_CAP_SOURCE_FRAMES[facing],
    canonicalSidePartCapTargetFrame(headId, facing),
  );
  if (facing === 'north') return [cap, detail];
  return [
    cap,
    fitCanonicalHairComponent(
      sourceShapes[1],
      CANONICAL_SIDE_PART_MASS_SOURCE_FRAMES[facing]!,
      canonicalSidePartMassTargetFrame(headId, facing),
    ),
    detail,
  ];
}

export function fitCanonicalSidePartVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalSidePartHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalSidePartShapes(sourceVariant.shapes, headId, facing),
  };
}
