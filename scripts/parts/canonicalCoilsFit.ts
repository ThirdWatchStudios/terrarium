import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';
import {
  CANONICAL_HAIR_HEAD_ENVELOPES,
  CANONICAL_HAIR_HEAD_IDS,
  fitCanonicalHairComponent,
  type CanonicalHairComponentFrame,
  type CanonicalHairHeadId,
} from './canonicalHairFit';

export const CANONICAL_COILS_HEAD_IDS = CANONICAL_HAIR_HEAD_IDS;
export type CanonicalCoilsHeadId = CanonicalHairHeadId;

const compact = (value: number): number => Number(value.toFixed(1));
const lobe = (centerX: number, centerY: number, radius: number): CanonicalHairComponentFrame => ({
  centerX,
  centerY,
  radiusX: radius,
  radiusY: radius,
});

export const CANONICAL_COILS_SOURCE_FRAMES: Readonly<
  Record<Facing, readonly CanonicalHairComponentFrame[]>
> = {
  south: [
    lobe(-25, 0, 7.6),
    lobe(-18, -9, 8.6),
    lobe(-7.5, -13, 7.6),
    lobe(4.5, -13, 7.6),
    lobe(16, -9, 8.6),
    lobe(25, 0, 7.6),
    lobe(-25, 8, 6.6),
    lobe(25, 8, 6.6),
  ],
  east: [
    lobe(-21, 0, 7.6),
    lobe(-16, -9, 8.6),
    lobe(-6, -14, 7.6),
    lobe(5, -13, 7.6),
    lobe(12, -8, 6.6),
    lobe(-22, 10, 6.6),
  ],
  north: [
    lobe(-25, 0, 7.6),
    lobe(-18, -9, 8.6),
    lobe(-7.5, -13, 7.6),
    lobe(4.5, -13, 7.6),
    lobe(16, -9, 8.6),
    lobe(25, 0, 7.6),
    lobe(-25, 9, 6.6),
    lobe(25, 9, 6.6),
  ],
};

export function canonicalCoilsTargetFrames(
  headId: CanonicalCoilsHeadId,
  facing: Facing,
): readonly CanonicalHairComponentFrame[] {
  const envelope = CANONICAL_HAIR_HEAD_ENVELOPES[headId];
  const crown = envelope.crownY + 3;
  const radius = Math.max(6, Math.min(9, compact(envelope.southHalf * 0.36)));
  const edgeRadius = Math.max(6, radius - 1);
  if (facing === 'south') {
    const width = envelope.southHalf + 4;
    return [
      lobe(compact(-width), 0, radius),
      lobe(compact(-width * 0.72), compact(crown + 9), radius + 1),
      lobe(compact(-width * 0.3), compact(crown + 5), radius),
      lobe(compact(width * 0.18), compact(crown + 5), radius),
      lobe(compact(width * 0.64), compact(crown + 9), radius + 1),
      lobe(compact(width), 0, radius),
      lobe(compact(-width), 8, edgeRadius),
      lobe(compact(width), 8, edgeRadius),
    ];
  }
  if (facing === 'east') {
    return [
      lobe(compact(envelope.eastBack), 0, radius),
      lobe(compact(envelope.eastBack + 5), compact(crown + 9), radius + 1),
      lobe(compact(envelope.eastBack + 15), compact(crown + 4), radius),
      lobe(compact(envelope.eastBack + 26), compact(crown + 5), radius),
      lobe(compact(envelope.eastFront - 2), compact(crown + 10), edgeRadius),
      lobe(compact(envelope.eastBack - 1), 10, edgeRadius),
    ];
  }
  const width = envelope.northHalf + 4;
  return [
    lobe(compact(-width), 0, radius),
    lobe(compact(-width * 0.72), compact(crown + 9), radius + 1),
    lobe(compact(-width * 0.3), compact(crown + 5), radius),
    lobe(compact(width * 0.18), compact(crown + 5), radius),
    lobe(compact(width * 0.64), compact(crown + 9), radius + 1),
    lobe(compact(width), 0, radius),
    lobe(compact(-width), 9, edgeRadius),
    lobe(compact(width), 9, edgeRadius),
  ];
}

export function fitCanonicalCoilsShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalCoilsHeadId,
  facing: Facing,
): ShapeSpec[] {
  const sourceFrames = CANONICAL_COILS_SOURCE_FRAMES[facing];
  if (sourceShapes.length !== sourceFrames.length) {
    throw new Error(
      `Canonical Coils ${facing} must contain ${sourceFrames.length} authored lobes`,
    );
  }
  const targetFrames = canonicalCoilsTargetFrames(headId, facing);
  return sourceShapes.map((shape, index) => fitCanonicalHairComponent(
    shape,
    sourceFrames[index],
    targetFrames[index],
  ));
}

export function fitCanonicalCoilsVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalCoilsHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalCoilsShapes(sourceVariant.shapes, headId, facing),
  };
}
