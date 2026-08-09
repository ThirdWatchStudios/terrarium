import type { PropPalette, ShapeSpec } from '../core/types';

export const QUOTA_CO_DOOR_PALETTE: PropPalette = {
  primary: '#53615E',
  secondary: '#6E7C78',
  accent: '#B96D52',
};

export type QuotaCoDoorAxis = 'horizontal' | 'vertical';
export type QuotaCoDoorState = 'closed' | 'open';

export interface QuotaCoDoorMaterialDefinition {
  readonly id: 'office' | 'brick' | 'panel' | 'cubicle' | 'slat';
  readonly label: string;
  readonly material: number;
  readonly wallIds: readonly string[];
  readonly propIdSuffix: string;
  readonly sourceFileSuffix: string;
  readonly palette: PropPalette & { readonly detail: string };
}

/**
 * The door leaf is shared equipment. These palettes belong only to the wall-owned
 * aperture, jamb, lintel, face, and return around it. `wallIds` accepts both the
 * exported instance id and the Terrarium template id so receivers can resolve old
 * layouts and live player-built walls through the same material key.
 */
export const QUOTA_CO_DOOR_MATERIALS: readonly QuotaCoDoorMaterialDefinition[] = [
  {
    id: 'office',
    label: 'Office',
    material: 0,
    wallIds: ['wall-office', 'office-wall'],
    propIdSuffix: '',
    sourceFileSuffix: '',
    palette: { primary: '#85867F', secondary: '#B0AEA5', accent: '#999A92', detail: '#777872' },
  },
  {
    id: 'brick',
    label: 'Brick',
    material: 1,
    wallIds: ['wall-brick', 'brick-wall'],
    propIdSuffix: '-brick',
    sourceFileSuffix: '-brick',
    palette: { primary: '#745146', secondary: '#A86D5A', accent: '#8D5E50', detail: '#D2AA97' },
  },
  {
    id: 'panel',
    label: 'Panel',
    material: 2,
    wallIds: ['wall-panel', 'panel-wall'],
    propIdSuffix: '-panel',
    sourceFileSuffix: '-panel',
    palette: { primary: '#66655F', secondary: '#94928A', accent: '#7D7C75', detail: '#B5B0A5' },
  },
  {
    id: 'cubicle',
    label: 'Cubicle',
    material: 3,
    wallIds: ['wall-cubicle', 'cubicle-partition'],
    propIdSuffix: '-cubicle',
    sourceFileSuffix: '-cubicle',
    palette: { primary: '#6D777D', secondary: '#99A3A8', accent: '#808A90', detail: '#5D676C' },
  },
  {
    id: 'slat',
    label: 'Wood slat',
    material: 4,
    wallIds: ['wall-slat', 'slat-wall'],
    propIdSuffix: '-slat',
    sourceFileSuffix: '-slat',
    palette: { primary: '#705643', secondary: '#9C7658', accent: '#83654E', detail: '#503E33' },
  },
];

export function quotaCoDoorMaterialForParams(
  params: Readonly<Record<string, number>>,
): QuotaCoDoorMaterialDefinition {
  const index = Number.isFinite(params.material) ? Math.round(params.material) : 0;
  return QUOTA_CO_DOOR_MATERIALS.find(({ material }) => material === index)
    ?? QUOTA_CO_DOOR_MATERIALS[0];
}

function remapDoorWallColor(
  value: string | undefined,
  source: QuotaCoDoorMaterialDefinition['palette'],
  target: PropPalette,
): string | undefined {
  if (!value) return value;
  const normalized = value.toUpperCase();
  if (normalized === source.primary.toUpperCase()) return target.primary;
  if (normalized === source.secondary.toUpperCase()) return target.secondary;
  if (normalized === source.accent.toUpperCase()) return target.accent;
  return value;
}

/**
 * Recolor only the wall-owned primary/secondary/accent paints in a canonical
 * door SVG. Shared leaf, glazing, outline, status, and material-detail colors
 * remain source-owned. The single-pass replacement cannot cascade when a
 * target color happens to equal another source color.
 */
export function remapQuotaCoDoorWallSvg(
  svg: string,
  params: Readonly<Record<string, number>>,
  target: PropPalette,
): string {
  const source = quotaCoDoorMaterialForParams(params).palette;
  return svg.replace(
    /(fill|stroke)="(#[0-9a-f]{6})"/gi,
    (match, attribute: string, color: string) => {
      const remapped = remapDoorWallColor(color, source, target);
      return remapped === color ? match : `${attribute}="${remapped}"`;
    },
  );
}

/** Shape equivalent of {@link remapQuotaCoDoorWallSvg} for layer export. */
export function remapQuotaCoDoorWallShapes(
  shapes: readonly ShapeSpec[],
  params: Readonly<Record<string, number>>,
  target: PropPalette,
): ShapeSpec[] {
  const source = quotaCoDoorMaterialForParams(params).palette;
  return shapes.map((shape) => ({
    ...shape,
    fill: remapDoorWallColor(shape.fill, source, target),
    stroke: remapDoorWallColor(shape.stroke, source, target),
  }));
}

export interface QuotaCoDoorSourceDefinition {
  readonly key: string;
  readonly axis: QuotaCoDoorAxis;
  readonly state: QuotaCoDoorState;
  readonly open: number;
  readonly facing: number;
  readonly material: number;
  readonly materialId: QuotaCoDoorMaterialDefinition['id'];
  readonly wallIds: readonly string[];
  readonly propId: string;
  readonly sourceFile: string;
}

const DOOR_STATES: readonly {
  readonly axis: QuotaCoDoorAxis;
  readonly state: QuotaCoDoorState;
  readonly open: number;
  readonly facing: number;
  readonly basePropId: string;
}[] = [
  { axis: 'horizontal', state: 'closed', open: 0, facing: 0, basePropId: 'prop-door' },
  { axis: 'horizontal', state: 'open', open: 1, facing: 0, basePropId: 'prop-open-door' },
  { axis: 'vertical', state: 'closed', open: 0, facing: 1, basePropId: 'prop-door-vertical' },
  { axis: 'vertical', state: 'open', open: 1, facing: 1, basePropId: 'prop-open-door-vertical' },
];

/** Twenty internal render SKUs: five wall materials × four fixed-view door states. */
export const QUOTA_CO_DOOR_SOURCE_DEFINITIONS: readonly QuotaCoDoorSourceDefinition[] =
  QUOTA_CO_DOOR_MATERIALS.flatMap((material) => DOOR_STATES.map((state) => ({
    key: `open=${state.open};facing=${state.facing};material=${material.material}`,
    axis: state.axis,
    state: state.state,
    open: state.open,
    facing: state.facing,
    material: material.material,
    materialId: material.id,
    wallIds: material.wallIds,
    propId: `${state.basePropId}${material.propIdSuffix}`,
    sourceFile: `door-${state.axis}-${state.state}${material.sourceFileSuffix}.svg`,
  })));
