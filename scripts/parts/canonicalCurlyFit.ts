import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairComponent,
  type CanonicalHairComponentFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_CURLY_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalCurlyHeadId = CanonicalHairHeadId;

const compact = (value: number): number => Number(value.toFixed(1));

export const CANONICAL_CURLY_SOURCE_FRAMES: Readonly<
  Record<Facing, readonly CanonicalHairComponentFrame[]>
> = {
  south: [
    { centerX: -18.1, centerY: 1, radiusX: 8.1, radiusY: 8.1 },
    { centerX: -10.5, centerY: -9, radiusX: 9.1, radiusY: 9.1 },
    { centerX: 0, centerY: -14, radiusX: 8.1, radiusY: 8.1 },
    { centerX: 10.1, centerY: -9, radiusX: 9.1, radiusY: 9.1 },
    { centerX: 18.1, centerY: 2, radiusX: 8.1, radiusY: 8.1 },
  ],
  east: [
    { centerX: -19, centerY: 2, radiusX: 8.1, radiusY: 8.1 },
    { centerX: -14, centerY: -9, radiusX: 9.1, radiusY: 9.1 },
    { centerX: -3, centerY: -14, radiusX: 8.1, radiusY: 8.1 },
    { centerX: 9, centerY: -8, radiusX: 8.1, radiusY: 8.1 },
  ],
  north: [
    { centerX: -18.1, centerY: 2, radiusX: 8.1, radiusY: 8.1 },
    { centerX: -10.5, centerY: -8, radiusX: 9.1, radiusY: 9.1 },
    { centerX: 0, centerY: -13, radiusX: 8.1, radiusY: 8.1 },
    { centerX: 10.1, centerY: -8, radiusX: 9.1, radiusY: 9.1 },
    { centerX: 18.1, centerY: 3, radiusX: 8.1, radiusY: 8.1 },
  ],
};

export function canonicalCurlyTargetFrames(
  headId: CanonicalCurlyHeadId,
  facing: Facing,
): readonly CanonicalHairComponentFrame[] {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  const crown = envelope.crownY + 4;
  const radius = Math.max(6, Math.min(8, compact(envelope.southHalf * 0.34)));
  if (facing === 'south') {
    return [
      { centerX: compact(-envelope.southHalf * 0.86), centerY: 1, radiusX: radius + 1, radiusY: radius + 1 },
      { centerX: compact(-envelope.southHalf * 0.5), centerY: compact(crown + 8), radiusX: radius + 2, radiusY: radius + 2 },
      { centerX: 0, centerY: compact(crown + 3), radiusX: radius + 1, radiusY: radius + 1 },
      { centerX: compact(envelope.southHalf * 0.48), centerY: compact(crown + 8), radiusX: radius + 2, radiusY: radius + 2 },
      { centerX: compact(envelope.southHalf * 0.86), centerY: 2, radiusX: radius + 1, radiusY: radius + 1 },
    ];
  }
  if (facing === 'east') {
    return [
      { centerX: compact(envelope.eastBack + 2), centerY: 2, radiusX: radius + 1, radiusY: radius + 1 },
      { centerX: compact(envelope.eastBack + 7), centerY: compact(crown + 8), radiusX: radius + 2, radiusY: radius + 2 },
      { centerX: compact(envelope.eastBack + 18), centerY: compact(crown + 3), radiusX: radius + 1, radiusY: radius + 1 },
      { centerX: compact(envelope.eastFront - 5), centerY: compact(crown + 9), radiusX: radius + 1, radiusY: radius + 1 },
    ];
  }
  return [
    { centerX: compact(-envelope.northHalf * 0.86), centerY: 2, radiusX: radius + 1, radiusY: radius + 1 },
    { centerX: compact(-envelope.northHalf * 0.5), centerY: compact(crown + 9), radiusX: radius + 2, radiusY: radius + 2 },
    { centerX: 0, centerY: compact(crown + 4), radiusX: radius + 1, radiusY: radius + 1 },
    { centerX: compact(envelope.northHalf * 0.48), centerY: compact(crown + 9), radiusX: radius + 2, radiusY: radius + 2 },
    { centerX: compact(envelope.northHalf * 0.86), centerY: 3, radiusX: radius + 1, radiusY: radius + 1 },
  ];
}

export function fitCanonicalCurlyShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalCurlyHeadId,
  facing: Facing,
): ShapeSpec[] {
  const sourceFrames = CANONICAL_CURLY_SOURCE_FRAMES[facing];
  if (sourceShapes.length !== sourceFrames.length) {
    throw new Error(
      `Canonical Curly ${facing} must contain ${sourceFrames.length} authored lobes`,
    );
  }
  const targetFrames = canonicalCurlyTargetFrames(headId, facing);
  return sourceShapes.map((shape, index) => fitCanonicalHairComponent(
    shape,
    sourceFrames[index],
    targetFrames[index],
  ));
}

export function fitCanonicalCurlyVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalCurlyHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalCurlyShapes(sourceVariant.shapes, headId, facing),
  };
}
