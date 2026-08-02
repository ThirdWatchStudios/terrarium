import svgpath from 'svgpath';

import type { PartVariant, ShapeSpec } from '../../src/core/types';

export const CANONICAL_HAIR_HEAD_IDS = [
  'head-round',
  'head-oval',
  'head-boxy',
  'head-long',
  'head-angular',
  'head-soft-square',
] as const;

export type CanonicalHairHeadId = typeof CANONICAL_HAIR_HEAD_IDS[number];

export interface CanonicalHairHeadEnvelope {
  readonly southHalf: number;
  readonly northHalf: number;
  readonly crownY: number;
  readonly eastBack: number;
  readonly eastFront: number;
}

/** Shared accepted head landmarks; hairstyle-specific adapters choose offsets. */
export const CANONICAL_HAIR_HEAD_ENVELOPES: Readonly<
  Record<CanonicalHairHeadId, CanonicalHairHeadEnvelope>
> = {
  'head-round': {
    southHalf: 21,
    northHalf: 21,
    crownY: -21,
    eastBack: -21,
    eastFront: 14,
  },
  'head-oval': {
    southHalf: 27,
    northHalf: 27,
    crownY: -20,
    eastBack: -26,
    eastFront: 17,
  },
  'head-boxy': {
    southHalf: 20,
    northHalf: 20,
    crownY: -21,
    eastBack: -20,
    eastFront: 14,
  },
  'head-long': {
    southHalf: 14,
    northHalf: 14,
    crownY: -22,
    eastBack: -16,
    eastFront: 10,
  },
  'head-angular': {
    southHalf: 23,
    northHalf: 23,
    crownY: -21,
    eastBack: -21,
    eastFront: 16,
  },
  'head-soft-square': {
    southHalf: 15,
    northHalf: 15,
    crownY: -21,
    eastBack: -22,
    eastFront: 10,
  },
};

export interface CanonicalHairAxisFrame {
  readonly low: number;
  readonly center: number;
  readonly high: number;
}

export interface CanonicalHairFitFrame {
  readonly x: CanonicalHairAxisFrame;
  readonly y: CanonicalHairAxisFrame;
}

export interface CanonicalHairComponentFrame {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

function remapAxis(
  value: number,
  source: CanonicalHairAxisFrame,
  target: CanonicalHairAxisFrame,
): number {
  const sourceStart = value <= source.center ? source.low : source.center;
  const sourceEnd = value <= source.center ? source.center : source.high;
  const targetStart = value <= source.center ? target.low : target.center;
  const targetEnd = value <= source.center ? target.center : target.high;
  const progress = (value - sourceStart) / (sourceEnd - sourceStart);
  return targetStart + (targetEnd - targetStart) * progress;
}

type PointWarp = (x: number, y: number) => [number, number];

function warpPathPoints(d: string, pointWarp: PointWarp): string {
  type Segment = (string | number)[];
  type ReplacementIterator = (
    segment: Segment,
    index: number,
    x: number,
    y: number,
  ) => Segment[] | undefined;
  const replacementIterator: ReplacementIterator = (
    segment,
    _index,
    currentX,
    currentY,
  ) => {
    const pair = (xIndex: number, yIndex: number): [number, number] =>
      pointWarp(Number(segment[xIndex]), Number(segment[yIndex]));
    switch (segment[0]) {
      case 'M':
      case 'L':
      case 'T': {
        const [x, y] = pair(1, 2);
        return [[segment[0], x, y]];
      }
      case 'H': {
        const [x, y] = pointWarp(Number(segment[1]), currentY);
        return [['L', x, y]];
      }
      case 'V': {
        const [x, y] = pointWarp(currentX, Number(segment[1]));
        return [['L', x, y]];
      }
      case 'C': {
        const first = pair(1, 2);
        const second = pair(3, 4);
        const end = pair(5, 6);
        return [[
          'C',
          first[0],
          first[1],
          second[0],
          second[1],
          end[0],
          end[1],
        ]];
      }
      case 'S':
      case 'Q': {
        const control = pair(1, 2);
        const end = pair(3, 4);
        return [[segment[0], control[0], control[1], end[0], end[1]]];
      }
      case 'A':
        throw new Error('Canonical hair path retained an arc after unarc()');
      case 'Z':
      case 'z':
        return undefined;
      default:
        throw new Error(`Unsupported canonical hair path command ${String(segment[0])}`);
    }
  };

  return svgpath(d)
    .abs()
    .unshort()
    .unarc()
    .iterate(
      replacementIterator as unknown as Parameters<
        ReturnType<typeof svgpath>['iterate']
      >[0],
    )
    .round(3)
    .toString();
}

export function fitCanonicalHairShapes(
  sourceShapes: readonly ShapeSpec[],
  source: CanonicalHairFitFrame,
  target: CanonicalHairFitFrame,
): ShapeSpec[] {
  const pointWarp: PointWarp = (x, y) => [
    remapAxis(x, source.x, target.x),
    remapAxis(y, source.y, target.y),
  ];
  return sourceShapes.map((shape) => ({
    ...shape,
    d: warpPathPoints(shape.d, pointWarp),
  }));
}

export function fitCanonicalHairVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  source: CanonicalHairFitFrame,
  target: CanonicalHairFitFrame,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalHairShapes(sourceVariant.shapes, source, target),
  };
}

/** Affine component fit for disconnected source shapes such as knots/tails. */
export function fitCanonicalHairComponent(
  sourceShape: ShapeSpec,
  source: CanonicalHairComponentFrame,
  target: CanonicalHairComponentFrame,
): ShapeSpec {
  return {
    ...sourceShape,
    d: svgpath(sourceShape.d)
      .translate(-source.centerX, -source.centerY)
      .scale(target.radiusX / source.radiusX, target.radiusY / source.radiusY)
      .translate(target.centerX, target.centerY)
      .round(3)
      .toString(),
  };
}
