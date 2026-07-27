import svgpath from 'svgpath';

import type { ShapeSpec } from '../../src/core/types';
import type { CompiledEqualHeightFrame } from '../walls/equalHeightImporter';
import {
  EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
  EQUAL_HEIGHT_FOOTPRINT_PROFILES,
  EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID,
  EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
  type EqualHeightFootprintProfile,
  type EqualHeightFootprintSourceState,
} from './equalHeightFootprintCalibration';

export type EqualHeightAllMaskWarpMode =
  | 'x'
  | 'y'
  | 'both'
  | 'identity';

export type EqualHeightAllMaskXOrientation =
  | 'high-frontage'
  | 'low-frontage'
  | 'mixed-high-to-low'
  | 'mixed-low-to-high'
  | 'none';

export interface EqualHeightAllMaskCalibration {
  readonly mode: EqualHeightAllMaskWarpMode;
  readonly xOrientation: EqualHeightAllMaskXOrientation;
  readonly yOrientation: 'high-frontage' | 'none';
}

export interface CalibratedEqualHeightFrame
  extends Omit<CompiledEqualHeightFrame, 'shapes'> {
  readonly shapes: readonly ShapeSpec[];
  readonly footprintCalibration: EqualHeightAllMaskCalibration & {
    readonly profileId: EqualHeightFootprintProfile['id'];
    readonly targetThickness: EqualHeightFootprintProfile['targetThickness'];
    readonly sourceFootprintState: EqualHeightFootprintSourceState;
    readonly transformApplied: boolean;
  };
}

/**
 * These source families are single-axis masses even though their blob masks can
 * include diagonal occupancy. Warping the other axis would move run-axis
 * detail without contributing to wall thickness.
 */
export const EQUAL_HEIGHT_ALL_MASK_X_ONLY = [1, 4, 5, 24, 42] as const;
export const EQUAL_HEIGHT_ALL_MASK_Y_ONLY = [2, 8, 10, 31, 38] as const;

/**
 * The fully filled hub already owns the complete cell. It remains the opaque
 * control and requires no footprint expansion.
 */
export const EQUAL_HEIGHT_ALL_MASK_IDENTITY = [46] as const;

export const EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY = {
  reviewOnly: false,
  selectedProfile: EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID,
  acceptedSourceState: 'accepted-112',
  acceptedSourceMutation: true,
  ledgerMutation: false,
  exporterIntegration: false,
  atlasMutation: false,
  schemaMutation: false,
  blobMutation: false,
  unityMutation: false,
} as const;

const X_ONLY = new Set<number>(EQUAL_HEIGHT_ALL_MASK_X_ONLY);
const Y_ONLY = new Set<number>(EQUAL_HEIGHT_ALL_MASK_Y_ONLY);
const IDENTITY = new Set<number>(EQUAL_HEIGHT_ALL_MASK_IDENTITY);

interface SourceFootprintAnchor {
  readonly index: 5 | 10 | 30 | 37;
  readonly sourceStem:
    | 'full_w_straight'
    | 'full_n_straight'
    | 'open_cross_filled_ne_sw'
    | 'open_cross_filled_nw';
  readonly shapeIndex: number;
  readonly axis: 'x' | 'y';
  readonly legacy: number;
  readonly accepted: number;
}

const SOURCE_FOOTPRINT_ANCHORS: readonly SourceFootprintAnchor[] = [
  {
    index: 5,
    sourceStem: 'full_w_straight',
    shapeIndex: 5,
    axis: 'x',
    legacy: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
    accepted: 11.5,
  },
  {
    index: 10,
    sourceStem: 'full_n_straight',
    shapeIndex: 4,
    axis: 'y',
    legacy: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
    accepted: 11.5,
  },
  {
    index: 30,
    sourceStem: 'open_cross_filled_ne_sw',
    shapeIndex: 0,
    axis: 'x',
    legacy: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
    accepted: 11.5,
  },
  {
    index: 37,
    sourceStem: 'open_cross_filled_nw',
    shapeIndex: 0,
    axis: 'x',
    legacy: 72,
    accepted: 116.5,
  },
] as const;

function firstMovePoint(d: string): readonly [number, number] {
  let point: readonly [number, number] | undefined;
  svgpath(d)
    .abs()
    .iterate((segment) => {
      if (!point && segment[0] === 'M') {
        point = [Number(segment[1]), Number(segment[2])];
      }
      return undefined;
    });
  if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
    throw new Error(
      'Equal-height footprint source anchor has no finite initial move',
    );
  }
  return point;
}

/**
 * The preview and promotion paths must agree on which authored footprint they
 * received. Multiple independent direct-source anchors make a partial or
 * unknown migration fail closed instead of applying the 112 warp twice.
 */
export function equalHeightAllMaskSourceFootprintState(
  frames: readonly CompiledEqualHeightFrame[],
): EqualHeightFootprintSourceState {
  if (frames.length !== 47) {
    throw new Error(
      `Equal-height footprint source-state detection requires 47 frames; received ${frames.length}`,
    );
  }
  const observed = SOURCE_FOOTPRINT_ANCHORS.map((anchor) => {
    const frame = frames[anchor.index];
    if (
      frame?.index !== anchor.index ||
      frame.source.sourceStem !== anchor.sourceStem
    ) {
      throw new Error(
        `Equal-height footprint source anchor mask_${anchor.index} lost canonical source ${anchor.sourceStem}`,
      );
    }
    const shape = frame.shapes[anchor.shapeIndex];
    if (!shape) {
      throw new Error(
        `Equal-height footprint source anchor mask_${anchor.index} lost shape ${anchor.shapeIndex}`,
      );
    }
    const point = firstMovePoint(shape.d);
    return {
      ...anchor,
      value: point[anchor.axis === 'x' ? 0 : 1],
    };
  });
  const matches = (
    state: 'legacy' | 'accepted',
  ): boolean => observed.every(
    (anchor) => Math.abs(anchor.value - anchor[state]) <= 0.001,
  );
  if (matches('legacy')) return 'legacy-68';
  if (matches('accepted')) return 'accepted-112';
  throw new Error(
    'Equal-height footprint source bank is mixed or unknown: ' +
      observed
        .map(({ index, axis, value }) => `mask_${index}.${axis}=${value}`)
        .join(', '),
  );
}

function selectedProfile(): EqualHeightFootprintProfile {
  const result = EQUAL_HEIGHT_FOOTPRINT_PROFILES.find(
    ({ id }) => id === EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID,
  );
  if (!result) {
    throw new Error(
      `Missing selected equal-height footprint profile ${EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID}`,
    );
  }
  return result;
}

export function equalHeightAllMaskWarpMode(
  index: number,
): EqualHeightAllMaskWarpMode {
  if (!Number.isInteger(index) || index < 0 || index >= 47) {
    throw new Error(`Equal-height footprint mask index out of range: ${index}`);
  }
  if (IDENTITY.has(index)) return 'identity';
  if (X_ONLY.has(index)) return 'x';
  if (Y_ONLY.has(index)) return 'y';
  return 'both';
}

export function equalHeightAllMaskCalibration(
  frame: CompiledEqualHeightFrame,
): EqualHeightAllMaskCalibration {
  const mode = equalHeightAllMaskWarpMode(frame.index);
  const warpsX = mode === 'x' || mode === 'both';
  const warpsY = mode === 'y' || mode === 'both';
  let xOrientation: EqualHeightAllMaskXOrientation = 'none';
  if (warpsX) {
    if (frame.index === 30) {
      xOrientation = 'mixed-high-to-low';
    } else if (frame.index === 40) {
      xOrientation = 'mixed-low-to-high';
    } else if (
      frame.index === 37 ||
      frame.source.transform === 'mirror-x'
    ) {
      xOrientation = 'low-frontage';
    } else {
      xOrientation = 'high-frontage';
    }
  }
  return {
    mode,
    xOrientation,
    yOrientation: warpsY ? 'high-frontage' : 'none',
  };
}

function highFrontageWarp(
  value: number,
  profile: EqualHeightFootprintProfile,
): number {
  if (profile.role === 'current') return value;
  const sourceBack = EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM;
  const front = EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM;
  const targetBack = front - profile.targetThickness;
  if (value <= sourceBack) {
    return value * targetBack / sourceBack;
  }
  if (value <= front) {
    return (
      targetBack +
      (value - sourceBack) *
        (front - targetBack) /
        (front - sourceBack)
    );
  }
  return front + (value - front) * (128 - front) / (128 - front);
}

export function warpEqualHeightAllMaskCoordinate(
  value: number,
  orientation: 'high-frontage' | 'low-frontage',
  profile: EqualHeightFootprintProfile = selectedProfile(),
): number {
  return orientation === 'high-frontage'
    ? highFrontageWarp(value, profile)
    : 128 - highFrontageWarp(128 - value, profile);
}

function warpPoint(
  x: number,
  y: number,
  calibration: EqualHeightAllMaskCalibration,
  profile: EqualHeightFootprintProfile,
): [number, number] {
  const highX = (): number =>
    warpEqualHeightAllMaskCoordinate(x, 'high-frontage', profile);
  const lowX = (): number =>
    warpEqualHeightAllMaskCoordinate(x, 'low-frontage', profile);
  let warpedX = x;
  if (calibration.xOrientation === 'high-frontage') {
    warpedX = highX();
  } else if (calibration.xOrientation === 'low-frontage') {
    warpedX = lowX();
  } else if (
    calibration.xOrientation === 'mixed-high-to-low' ||
    calibration.xOrientation === 'mixed-low-to-high'
  ) {
    throw new Error(
      'Mixed-register equal-height paths require their source-owned S-union compiler',
    );
  }
  const warpedY = calibration.yOrientation === 'none'
    ? y
    : warpEqualHeightAllMaskCoordinate(y, 'high-frontage', profile);
  return [warpedX, warpedY];
}

type PointWarp = (x: number, y: number) => [number, number];

function warpPathPoints(
  d: string,
  pointWarp: PointWarp,
): string {
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
      pointWarp(
        Number(segment[xIndex]),
        Number(segment[yIndex]),
      );
    switch (segment[0]) {
      case 'M':
      case 'L':
      case 'T': {
        const [x, y] = pair(1, 2);
        return [[segment[0], x, y]];
      }
      case 'H': {
        const [x, y] = pointWarp(
          Number(segment[1]),
          currentY,
        );
        return [['L', x, y]];
      }
      case 'V': {
        const [x, y] = pointWarp(
          currentX,
          Number(segment[1]),
        );
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
        return [[
          segment[0],
          control[0],
          control[1],
          end[0],
          end[1],
        ]];
      }
      case 'A':
        throw new Error(
          'Equal-height footprint path retained an arc after unarc()',
        );
      case 'Z':
      case 'z':
        return undefined;
      default:
        throw new Error(
          `Unsupported equal-height footprint path command ${String(segment[0])}`,
        );
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

export function warpEqualHeightAllMaskPath(
  d: string,
  calibration: EqualHeightAllMaskCalibration,
  profile: EqualHeightFootprintProfile = selectedProfile(),
): string {
  if (calibration.mode === 'identity' || profile.role === 'current') {
    return d;
  }
  return warpPathPoints(
    d,
    (x, y) => warpPoint(x, y, calibration, profile),
  );
}

function containCalibratedStroke(shape: ShapeSpec): ShapeSpec {
  const halfStroke = (shape.strokeWidth ?? 0) / 2;
  if (halfStroke <= 0) return shape;
  const maximum = 128 - halfStroke;
  const clamp = (value: number): number =>
    Math.min(maximum, Math.max(halfStroke, value));
  return {
    ...shape,
    d: warpPathPoints(
      shape.d,
      (x, y) => [clamp(x), clamp(y)],
    ),
  };
}

export function calibrateEqualHeightAllMaskShapes(
  shapes: readonly ShapeSpec[],
  calibration: EqualHeightAllMaskCalibration,
  profile: EqualHeightFootprintProfile = selectedProfile(),
): readonly ShapeSpec[] {
  if (calibration.mode === 'identity' || profile.role === 'current') {
    return shapes;
  }
  return shapes.map((shape) =>
    containCalibratedStroke({
      ...shape,
      d: warpEqualHeightAllMaskPath(shape.d, calibration, profile),
    }));
}

const MASK_30_FILTERED_MIRROR_OMISSIONS = new Set([4, 18]);
const MASK_30_S_UNION_SHAPES = new Set([0, 6, 7]);
const MASK_30_HORIZONTAL_RETURN_SHAPES =
  new Set([1, 2, 3, 4, 9, 10, 11, 12, 17, 18]);
const MASK_30_SOUTH_LEG_SHAPES = new Set([5, 13, 14, 15, 19]);

const HIGH_BOTH_CALIBRATION: EqualHeightAllMaskCalibration = {
  mode: 'both',
  xOrientation: 'high-frontage',
  yOrientation: 'high-frontage',
};
const Y_ONLY_CALIBRATION: EqualHeightAllMaskCalibration = {
  mode: 'y',
  xOrientation: 'none',
  yOrientation: 'high-frontage',
};
const LOW_X_ONLY_CALIBRATION: EqualHeightAllMaskCalibration = {
  mode: 'x',
  xOrientation: 'low-frontage',
  yOrientation: 'none',
};

/**
 * mask_30 owns two vertical registers inside one accepted S-union. Its
 * northwest crook belongs to the high/right register and its southeast crook
 * belongs to the low/left register. A discrete source-owned handoff preserves
 * that orthogonal union; blending the registers through the whole cell shears
 * it into a diagonal wedge.
 */
function calibrateMask30SUnionPath(
  d: string,
  profile: EqualHeightFootprintProfile,
): string {
  return warpPathPoints(d, (x, y) => [
    warpEqualHeightAllMaskCoordinate(
      x,
      y <= 64 ? 'high-frontage' : 'low-frontage',
      profile,
    ),
    warpEqualHeightAllMaskCoordinate(y, 'high-frontage', profile),
  ]);
}

function calibrateMask30ArrisSeam(
  d: string,
  profile: EqualHeightFootprintProfile,
): string {
  const subpaths = d.match(/M[^M]*/g);
  if (!subpaths || subpaths.length !== 2) {
    throw new Error(
      'Equal-height footprint mask_30 arris seam lost its two source-owned subpaths',
    );
  }
  return [
    warpEqualHeightAllMaskPath(
      subpaths[0],
      HIGH_BOTH_CALIBRATION,
      profile,
    ),
    warpEqualHeightAllMaskPath(
      subpaths[1],
      LOW_X_ONLY_CALIBRATION,
      profile,
    ),
  ].join('');
}

function calibrateMask30Shapes(
  shapes: readonly ShapeSpec[],
  profile: EqualHeightFootprintProfile,
): readonly ShapeSpec[] {
  if (shapes.length !== 20) {
    throw new Error(
      `Equal-height footprint mask_30 requires its accepted 20-shape inventory; received ${shapes.length}`,
    );
  }
  return shapes.map((shape, index) => {
    let d: string;
    if (MASK_30_S_UNION_SHAPES.has(index)) {
      d = calibrateMask30SUnionPath(shape.d, profile);
    } else if (MASK_30_HORIZONTAL_RETURN_SHAPES.has(index)) {
      d = warpEqualHeightAllMaskPath(
        shape.d,
        Y_ONLY_CALIBRATION,
        profile,
      );
    } else if (MASK_30_SOUTH_LEG_SHAPES.has(index)) {
      d = warpEqualHeightAllMaskPath(
        shape.d,
        LOW_X_ONLY_CALIBRATION,
        profile,
      );
    } else if (index === 8) {
      d = warpEqualHeightAllMaskPath(
        shape.d,
        HIGH_BOTH_CALIBRATION,
        profile,
      );
    } else if (index === 16) {
      d = calibrateMask30ArrisSeam(shape.d, profile);
    } else {
      throw new Error(
        `Equal-height footprint mask_30 lacks a source-owned rule for shape ${index}`,
      );
    }
    return containCalibratedStroke({ ...shape, d });
  });
}

function mirrorPathX(d: string): string {
  return svgpath(d)
    .matrix([-1, 0, 0, 1, 128, 0])
    .round(3)
    .toString();
}

function calibrateMask40Shapes(
  acceptedMask30: readonly ShapeSpec[],
  calibratedMask30: readonly ShapeSpec[],
  acceptedMask40: readonly ShapeSpec[],
): readonly ShapeSpec[] {
  const acceptedFiltered = acceptedMask30.filter(
    (_, index) => !MASK_30_FILTERED_MIRROR_OMISSIONS.has(index),
  );
  const calibratedFiltered = calibratedMask30.filter(
    (_, index) => !MASK_30_FILTERED_MIRROR_OMISSIONS.has(index),
  );
  if (
    acceptedFiltered.length !== acceptedMask40.length ||
    calibratedFiltered.length !== acceptedMask40.length
  ) {
    throw new Error(
      'Equal-height footprint mask_40 lost its accepted filtered mask_30 inventory',
    );
  }
  return acceptedMask40.map((targetShape, index) => {
    const expectedAcceptedPath = mirrorPathX(
      acceptedFiltered[index].d,
    );
    if (targetShape.d !== expectedAcceptedPath) {
      throw new Error(
        `Equal-height footprint mask_40 shape ${index} drifted from its accepted filtered mask_30 mirror`,
      );
    }
    return {
      ...targetShape,
      d: mirrorPathX(calibratedFiltered[index].d),
    };
  });
}

export function compileSelectedEqualHeightAllMaskFrames(
  frames: readonly CompiledEqualHeightFrame[],
): CalibratedEqualHeightFrame[] {
  const sourceFootprintState =
    equalHeightAllMaskSourceFootprintState(frames);
  const profile = selectedProfile();
  const acceptedMask30 = frames[30];
  const transformApplied = sourceFootprintState === 'legacy-68';
  const calibratedMask30 = transformApplied
    ? calibrateMask30Shapes(acceptedMask30.shapes, profile)
    : acceptedMask30.shapes;
  return frames.map((frame, expectedIndex) => {
    if (frame.index !== expectedIndex) {
      throw new Error(
        `Equal-height footprint calibration expected mask_${expectedIndex}; received ${frame.id}`,
      );
    }
    const calibration = equalHeightAllMaskCalibration(frame);
    const shapes = !transformApplied
      ? frame.shapes
      : frame.index === 30
        ? calibratedMask30
        : frame.index === 40
          ? calibrateMask40Shapes(
              acceptedMask30.shapes,
              calibratedMask30,
              frame.shapes,
            )
          : calibrateEqualHeightAllMaskShapes(
              frame.shapes,
              calibration,
              profile,
            );
    return {
      ...frame,
      shapes,
      footprintCalibration: {
        ...calibration,
        profileId: profile.id,
        targetThickness: profile.targetThickness,
        sourceFootprintState,
        transformApplied,
      },
    };
  });
}
