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

export const CANONICAL_PONYTAIL_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalPonytailHeadId = CanonicalHairHeadId;

export const CANONICAL_PONYTAIL_CAP_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairFitFrame>
> = {
  south: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -22, center: -4, high: 1 },
  },
  east: {
    x: { low: -22, center: -2, high: 14 },
    y: { low: -22, center: -2, high: 9 },
  },
  north: {
    x: { low: -22, center: 0, high: 22 },
    y: { low: -22, center: 4, high: 9 },
  },
};

export const CANONICAL_PONYTAIL_ATTACHMENT_SOURCE_FRAMES: Readonly<
  Record<Facing, CanonicalHairComponentFrame>
> = {
  south: { centerX: 21, centerY: -2, radiusX: 1, radiusY: 1 },
  east: { centerX: -22, centerY: -3, radiusX: 1, radiusY: 1 },
  north: { centerX: 20, centerY: -3, radiusX: 1, radiusY: 1 },
};

export function canonicalPonytailCapTargetFrame(
  headId: CanonicalPonytailHeadId,
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
    y: { low: envelope.crownY - 1, center: -2, high: 9 },
  };
}

export function canonicalPonytailAttachmentTargetFrame(
  headId: CanonicalPonytailHeadId,
  facing: Facing,
): CanonicalHairComponentFrame {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  if (facing === 'south') {
    return { centerX: envelope.southHalf, centerY: -2, radiusX: 1, radiusY: 1 };
  }
  if (facing === 'north') {
    return { centerX: envelope.northHalf - 1, centerY: -3, radiusX: 1, radiusY: 1 };
  }
  return { centerX: envelope.eastBack - 1, centerY: -3, radiusX: 1, radiusY: 1 };
}

export function fitCanonicalPonytailShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalPonytailHeadId,
  facing: Facing,
): ShapeSpec[] {
  if (sourceShapes.length !== 3) {
    throw new Error(`Canonical Ponytail ${facing} must contain cap, tie, and tail shapes`);
  }
  const sourceAttachment = CANONICAL_PONYTAIL_ATTACHMENT_SOURCE_FRAMES[facing];
  const targetAttachment = canonicalPonytailAttachmentTargetFrame(headId, facing);
  return [
    ...fitCanonicalHairShapes(
      [sourceShapes[0]],
      CANONICAL_PONYTAIL_CAP_SOURCE_FRAMES[facing],
      canonicalPonytailCapTargetFrame(headId, facing),
    ),
    fitCanonicalHairComponent(sourceShapes[1], sourceAttachment, targetAttachment),
    fitCanonicalHairComponent(sourceShapes[2], sourceAttachment, targetAttachment),
  ];
}

export function fitCanonicalPonytailVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalPonytailHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalPonytailShapes(sourceVariant.shapes, headId, facing),
  };
}
