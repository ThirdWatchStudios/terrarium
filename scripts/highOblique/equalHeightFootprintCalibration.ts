import svgpath from 'svgpath';

import type { ShapeSpec } from '../../src/core/types';

/**
 * Footprint calibration profiles retained around the accepted 112-unit source
 * gate. The 68/96/128 profiles remain comparison-only; candidate-112 is the
 * historical profile id for the now source-owned accepted geometry. None of
 * these ids creates a production wall variant or crosses the exporter, schema,
 * atlas, or Unity registration boundaries.
 */
export interface EqualHeightFootprintProfile {
  readonly id: 'current-68' | 'candidate-96' | 'candidate-112' | 'control-128';
  readonly label: string;
  readonly targetThickness: 68 | 96 | 112 | 128;
  readonly role: 'current' | 'lighter-candidate' | 'selected-candidate' | 'overscan-control';
}

export type EqualHeightFootprintAxis = 'x' | 'y' | 'both';
export type EqualHeightFootprintSourceState =
  | 'legacy-68'
  | 'accepted-112';

export const EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM = 123.5;
export const EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM = 56;
export const EQUAL_HEIGHT_FOOTPRINT_SOURCE_THICKNESS =
  EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM -
  EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM;
export const EQUAL_HEIGHT_FOOTPRINT_ACCEPTED_BACK_DATUM =
  EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM - 112;

export const EQUAL_HEIGHT_FOOTPRINT_PROFILES:
  readonly EqualHeightFootprintProfile[] = [
    {
      id: 'current-68',
      label: '68 nominal · 67.5 measured',
      targetThickness: 68,
      role: 'current',
    },
    {
      id: 'candidate-96',
      label: '96 px · lighter alternate',
      targetThickness: 96,
      role: 'lighter-candidate',
    },
    {
      id: 'candidate-112',
      label: '112 px · accepted source',
      targetThickness: 112,
      role: 'selected-candidate',
    },
    {
      id: 'control-128',
      label: '128 px · overscan stress test',
      targetThickness: 128,
      role: 'overscan-control',
    },
  ];

export const EQUAL_HEIGHT_FOOTPRINT_SELECTED_PROFILE_ID =
  'candidate-112' as const;

/**
 * Only the masks needed by the footprint proof are mapped here. This is not an
 * all-47 propagation table.
 *
 * Blob bits: N=1, E=2, S=4, W=8.
 */
export const EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES:
  Readonly<Record<number, EqualHeightFootprintAxis>> = {
    1: 'x',
    2: 'y',
    5: 'x',
    6: 'both',
    8: 'y',
    10: 'y',
  };

export const EQUAL_HEIGHT_FOOTPRINT_REPRESENTATIVE_MASKS = [
  10,
  5,
  6,
  8,
] as const;

export const EQUAL_HEIGHT_FOOTPRINT_BOUNDARY = {
  reviewOnly: false,
  comparisonProfilesReviewOnly: true,
  acceptedSourceState: 'accepted-112',
  modifiesAcceptedSourceSvg: true,
  all47Propagation: true,
  exporterIntegration: false,
  schemaChange: false,
  unityRegistration: false,
} as const;

export function equalHeightFootprintScale(
  profile: EqualHeightFootprintProfile,
  sourceState: EqualHeightFootprintSourceState = 'legacy-68',
): number {
  const sourceThickness = sourceState === 'accepted-112'
    ? 112
    : EQUAL_HEIGHT_FOOTPRINT_SOURCE_THICKNESS;
  const targetThickness = profile.role === 'current'
    ? EQUAL_HEIGHT_FOOTPRINT_SOURCE_THICKNESS
    : profile.targetThickness;
  return targetThickness / sourceThickness;
}

export function equalHeightFootprintSourceBackDatum(
  sourceState: EqualHeightFootprintSourceState,
): number {
  return sourceState === 'accepted-112'
    ? EQUAL_HEIGHT_FOOTPRINT_ACCEPTED_BACK_DATUM
    : EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM;
}

export function transformEqualHeightFootprintPoint(
  point: { readonly x: number; readonly y: number },
  axis: EqualHeightFootprintAxis,
  profile: EqualHeightFootprintProfile,
  sourceState: EqualHeightFootprintSourceState = 'legacy-68',
): { x: number; y: number } {
  const scale = equalHeightFootprintScale(profile, sourceState);
  const transformCoordinate = (value: number): number =>
    EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM +
    (value - EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM) * scale;
  return {
    x: axis === 'x' || axis === 'both'
      ? transformCoordinate(point.x)
      : point.x,
    y: axis === 'y' || axis === 'both'
      ? transformCoordinate(point.y)
      : point.y,
  };
}

function calibrationMatrix(
  axis: EqualHeightFootprintAxis,
  profile: EqualHeightFootprintProfile,
  sourceState: EqualHeightFootprintSourceState,
): [number, number, number, number, number, number] {
  const scale = equalHeightFootprintScale(profile, sourceState);
  const translation = EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM * (1 - scale);
  return [
    axis === 'x' || axis === 'both' ? scale : 1,
    0,
    0,
    axis === 'y' || axis === 'both' ? scale : 1,
    axis === 'x' || axis === 'both' ? translation : 0,
    axis === 'y' || axis === 'both' ? translation : 0,
  ];
}

export function calibrateEqualHeightFootprintShape(
  shape: ShapeSpec,
  axis: EqualHeightFootprintAxis,
  profile: EqualHeightFootprintProfile,
  sourceState: EqualHeightFootprintSourceState = 'legacy-68',
): ShapeSpec {
  if (equalHeightFootprintScale(profile, sourceState) === 1) return shape;
  return {
    ...shape,
    d: svgpath(shape.d)
      .matrix(calibrationMatrix(axis, profile, sourceState))
      .round(3)
      .toString(),
  };
}

export function calibrateEqualHeightFootprintShapes(
  shapes: readonly ShapeSpec[],
  axis: EqualHeightFootprintAxis,
  profile: EqualHeightFootprintProfile,
  sourceState: EqualHeightFootprintSourceState = 'legacy-68',
): readonly ShapeSpec[] {
  if (equalHeightFootprintScale(profile, sourceState) === 1) return shapes;
  return shapes.map((shape) =>
    calibrateEqualHeightFootprintShape(
      shape,
      axis,
      profile,
      sourceState,
    ),
  );
}
