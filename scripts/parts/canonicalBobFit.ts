import svgpath from 'svgpath';

import type { Facing, PartVariant, ShapeSpec } from '../../src/core/types';

export const CANONICAL_BOB_HEAD_IDS = [
  'head-round',
  'head-oval',
  'head-boxy',
  'head-long',
  'head-angular',
  'head-soft-square',
] as const;

export type CanonicalBobHeadId = typeof CANONICAL_BOB_HEAD_IDS[number];

interface AxisFrame {
  readonly low: number;
  readonly center: number;
  readonly high: number;
}

export interface CanonicalBobFitFrame {
  readonly x: AxisFrame;
  readonly y: AxisFrame;
}

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

interface HeadEnvelope {
  readonly southHalf: number;
  readonly northHalf: number;
  readonly crownY: number;
  readonly eastBack: number;
  readonly eastFront: number;
}

/**
 * The accepted head envelopes, expressed as declarative fit data. These are
 * the only per-head values in the proof; all visible paths come from Bob SVGs.
 */
export const CANONICAL_BOB_HEAD_ENVELOPES: Readonly<
  Record<CanonicalBobHeadId, HeadEnvelope>
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

function remapAxis(value: number, source: AxisFrame, target: AxisFrame): number {
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
        throw new Error('Canonical Bob path retained an arc after unarc()');
      case 'Z':
      case 'z':
        return undefined;
      default:
        throw new Error(`Unsupported canonical Bob path command ${String(segment[0])}`);
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

export function fitCanonicalBobShapes(
  sourceShapes: readonly ShapeSpec[],
  headId: CanonicalBobHeadId,
  facing: Facing,
): ShapeSpec[] {
  const source = CANONICAL_BOB_SOURCE_FRAMES[facing];
  const target = canonicalBobTargetFrame(headId, facing);
  const pointWarp: PointWarp = (x, y) => [
    remapAxis(x, source.x, target.x),
    remapAxis(y, source.y, target.y),
  ];
  return sourceShapes.map((shape) => ({
    ...shape,
    d: warpPathPoints(shape.d, pointWarp),
  }));
}

export function fitCanonicalBobVariant(
  sourceVariant: Pick<PartVariant, 'z'> & { readonly shapes: readonly ShapeSpec[] },
  headId: CanonicalBobHeadId,
  facing: Facing,
): PartVariant {
  return {
    ...sourceVariant,
    shapes: fitCanonicalBobShapes(sourceVariant.shapes, headId, facing),
  };
}
