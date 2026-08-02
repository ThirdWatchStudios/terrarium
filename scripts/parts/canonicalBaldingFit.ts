import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairComponent,
  type CanonicalHairComponentFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_BALDING_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalBaldingHeadId = CanonicalHairHeadId;

const sourceFrames: Readonly<Record<Facing, readonly CanonicalHairComponentFrame[]>> = {
  south: [
    { centerX: -21, centerY: 4, radiusX: 5, radiusY: 9 },
    { centerX: 21, centerY: 4, radiusX: 5, radiusY: 9 },
  ],
  east: [
    { centerX: -20, centerY: 3.5, radiusX: 6, radiusY: 9.5 },
  ],
  north: [
    { centerX: 0, centerY: 5.5, radiusX: 21, radiusY: 9.5 },
  ],
};

export const CANONICAL_BALDING_SOURCE_FRAMES = sourceFrames;

export function canonicalBaldingTargetFrames(
  headId: CanonicalBaldingHeadId,
  facing: Facing,
): readonly CanonicalHairComponentFrame[] {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  const templeWidth = Math.max(4, Number((envelope.southHalf * 0.22).toFixed(1)));
  if (facing === 'south') {
    const templeX = Number((envelope.southHalf * 0.9).toFixed(1));
    return [
      { centerX: -templeX, centerY: 5, radiusX: templeWidth, radiusY: 7.5 },
      { centerX: templeX, centerY: 5, radiusX: templeWidth, radiusY: 7.5 },
    ];
  }
  if (facing === 'east') {
    return [{
      centerX: envelope.eastBack + 4,
      centerY: 5,
      radiusX: Math.max(5, templeWidth),
      radiusY: 7.5,
    }];
  }
  return [{
    centerX: 0,
    centerY: 5.5,
    radiusX: envelope.northHalf + 1,
    radiusY: 9.5,
  }];
}

export function fitCanonicalBaldingShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalBaldingHeadId,
  facing: Facing,
): ShapeSpec[] {
  const sources = CANONICAL_BALDING_SOURCE_FRAMES[facing];
  const targets = canonicalBaldingTargetFrames(headId, facing);
  if (sourceShapes.length !== sources.length) {
    throw new Error(
      `Canonical Balding ${facing} must contain ${sources.length} authored component(s)`,
    );
  }
  return sourceShapes.map((shape, index) =>
    fitCanonicalHairComponent(shape, sources[index], targets[index]));
}

export function fitCanonicalBaldingVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalBaldingHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalBaldingShapes(sourceVariant.shapes, headId, facing),
  };
}
