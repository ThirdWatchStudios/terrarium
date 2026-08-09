import type { PropPalette, ShapeSpec } from '../core/types';
import {
  QUOTA_CO_DOOR_MATERIALS,
  type QuotaCoDoorMaterialDefinition,
} from './doorManifest';

/** Shared frame, glass, and blind metadata; wall structure is instance-owned. */
export const QUOTA_CO_WINDOW_PALETTE: PropPalette = {
  primary: '#323431',
  secondary: '#83A9A6',
  accent: '#C3C0B6',
};

export type QuotaCoWindowAxis = 'horizontal' | 'vertical';
export type QuotaCoWindowMaterialDefinition = QuotaCoDoorMaterialDefinition;

/**
 * Doors and windows interrupt the same five retained wall families. Reusing the
 * exact material registry keeps receiver ids and export-time wall matching from
 * becoming two subtly different contracts.
 */
export const QUOTA_CO_WINDOW_MATERIALS: readonly QuotaCoWindowMaterialDefinition[] =
  QUOTA_CO_DOOR_MATERIALS;

export function quotaCoWindowMaterialForParams(
  params: Readonly<Record<string, number>>,
): QuotaCoWindowMaterialDefinition {
  const index = Number.isFinite(params.material) ? Math.round(params.material) : 0;
  return QUOTA_CO_WINDOW_MATERIALS.find(({ material }) => material === index)
    ?? QUOTA_CO_WINDOW_MATERIALS[0];
}

function remapWindowWallColor(
  value: string | undefined,
  source: QuotaCoWindowMaterialDefinition['palette'],
  target: PropPalette,
): string | undefined {
  if (!value) return value;
  const normalized = value.toUpperCase();
  if (normalized === source.primary.toUpperCase()) return target.primary;
  if (normalized === source.secondary.toUpperCase()) return target.secondary;
  if (normalized === source.accent.toUpperCase()) return target.accent;
  return value;
}

/** Recolor only face-owned wall paints; frame, glass, blinds, and mullion stay fixed. */
export function remapQuotaCoWindowWallSvg(
  svg: string,
  params: Readonly<Record<string, number>>,
  target: PropPalette,
): string {
  const source = quotaCoWindowMaterialForParams(params).palette;
  return svg.replace(
    /(fill|stroke)="(#[0-9a-f]{6})"/gi,
    (match, attribute: string, color: string) => {
      const remapped = remapWindowWallColor(color, source, target);
      return remapped === color ? match : `${attribute}="${remapped}"`;
    },
  );
}

/** Shape equivalent of {@link remapQuotaCoWindowWallSvg} for layer export. */
export function remapQuotaCoWindowWallShapes(
  shapes: readonly ShapeSpec[],
  params: Readonly<Record<string, number>>,
  target: PropPalette,
): ShapeSpec[] {
  const source = quotaCoWindowMaterialForParams(params).palette;
  return shapes.map((shape) => ({
    ...shape,
    fill: remapWindowWallColor(shape.fill, source, target),
    stroke: remapWindowWallColor(shape.stroke, source, target),
  }));
}

export interface QuotaCoWindowSourceDefinition {
  readonly key: string;
  readonly axis: QuotaCoWindowAxis;
  readonly facing: number;
  readonly material: number;
  readonly materialId: QuotaCoWindowMaterialDefinition['id'];
  readonly wallIds: readonly string[];
  readonly propId: string;
  readonly sourceFile: string;
}

const WINDOW_AXES: readonly {
  readonly axis: QuotaCoWindowAxis;
  readonly facing: number;
  readonly basePropId: string;
}[] = [
  { axis: 'horizontal', facing: 0, basePropId: 'prop-window' },
  { axis: 'vertical', facing: 1, basePropId: 'prop-window-vertical' },
];

/** Ten internal render SKUs: five retained wall materials × two fixed views. */
export const QUOTA_CO_WINDOW_SOURCE_DEFINITIONS: readonly QuotaCoWindowSourceDefinition[] =
  QUOTA_CO_WINDOW_MATERIALS.flatMap((material) => WINDOW_AXES.map((axis) => ({
    key: `facing=${axis.facing};material=${material.material}`,
    axis: axis.axis,
    facing: axis.facing,
    material: material.material,
    materialId: material.id,
    wallIds: material.wallIds,
    propId: `${axis.basePropId}${material.propIdSuffix}`,
    sourceFile: `window-${axis.axis}${material.sourceFileSuffix}.svg`,
  })));
