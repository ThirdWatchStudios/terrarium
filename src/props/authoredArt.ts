import type {
  Projection,
  PropPalette,
  ShapeSpec,
} from '../core/types';
import { QUOTA_CO_WORKHORSE_PROP_ART } from './generated/quotaCoWorkhorseArt';
import { QUOTA_CO_DEPARTMENT_MACHINE_ART } from './generated/quotaCoDepartmentMachineArt';
import { IRIS_HARDWARE_ART } from './generated/irisHardwareArt';

export interface ImportedPropArt {
  id: string;
  projection: Projection;
  sourceFile: string;
  sourceSha256: string;
  paletteDefaults: PropPalette;
  variants: Readonly<Record<string, readonly ShapeSpec[]>>;
  /** Optional canonical flat SVGs for source-exact authored SKU export. */
  sourceSvgVariants?: Readonly<Record<string, string>>;
}

const ART_BY_ID = new Map<string, ImportedPropArt>(
  [
    ...QUOTA_CO_WORKHORSE_PROP_ART,
    ...IRIS_HARDWARE_ART,
    ...QUOTA_CO_DEPARTMENT_MACHINE_ART,
  ]
    .map((entry) => [entry.id, entry]),
);

function discrete(
  params: Readonly<Record<string, number>>,
  key: string,
  min: number,
  max: number,
  step: number,
  fallback: number,
): number {
  const raw = Number.isFinite(params[key]) ? params[key] : fallback;
  const snapped = min + Math.round((raw - min) / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

function discreteWithCanonical(
  params: Readonly<Record<string, number>>,
  key: string,
  min: number,
  max: number,
  step: number,
  canonical: number,
): number {
  if (params[key] === canonical) return canonical;
  return discrete(params, key, min, max, step, canonical);
}

function variantKey(id: string, params: Readonly<Record<string, number>>): string {
  switch (id) {
    case 'iris-installation-unit':
    case 'iris-installation-unit-dormant':
      return `height=${discrete(params, 'height', 78, 98, 2, 90)}`;
    case 'loading_dock':
      return `fill=${discrete(params, 'fill', 0, 2, 1, 0)}`;
    case 'intake_tray_small':
    case 'intake_tray_large':
    case 'dispatch_station':
    case 'docket_rack':
      return `fill=${discrete(params, 'fill', 0, 3, 1, 0)}`;
    case 'cubicle_partition_straight':
    case 'cubicle_partition_endcap':
      return `facing=${discrete(params, 'facing', 0, 1, 1, 0)}`;
    case 'printer':
    case 'printer-jammed':
      return `width=${discrete(params, 'width', 44, 72, 2, 56)}`;
    case 'coffee-machine':
    case 'coffee-machine-broken':
      return `height=${discrete(params, 'height', 40, 56, 2, 48)}`;
    case 'water-cooler':
    case 'water-cooler-empty':
      return `height=${discrete(params, 'height', 44, 68, 2, 56)}`;
    case 'shredder':
      return `height=${discrete(params, 'height', 34, 50, 2, 42)}`;
    case 'microwave':
      return `width=${discrete(params, 'width', 38, 52, 2, 44)}`;
    case 'fridge':
      return `height=${discrete(params, 'height', 66, 90, 2, 78)}`;
    case 'vending-machine':
      return `height=${discrete(params, 'height', 70, 94, 2, 84)};stocked=${discrete(params, 'stocked', 1, 3, 1, 3)}`;
    case 'desk':
      return `width=${discrete(params, 'width', 72, 120, 4, 100)};monitor=${discrete(params, 'monitor', 0, 1, 1, 1)}`;
    case 'office-chair':
      return `size=${discrete(params, 'size', 10, 16, 1, 13)}`;
    case 'filing-cabinet':
      return `drawers=${discrete(params, 'drawers', 2, 4, 1, 4)}`;
    case 'copier':
      return `height=${discrete(params, 'height', 60, 78, 2, 70)}`;
    case 'office-plant':
      return `bushiness=${discrete(params, 'bushiness', 1, 3, 1, 2)}`;
    case 'standing-desk':
      return `width=${discrete(params, 'width', 84, 116, 4, 100)};dual=${discrete(params, 'dual', 0, 1, 1, 0)}`;
    case 'cubicle-workstation':
      return `openness=${discrete(params, 'openness', 0, 3, 1, 0)};clutter=${discrete(params, 'clutter', 0, 2, 1, 1)}`;
    case 'reception-desk':
      return `width=${discrete(params, 'width', 72, 104, 4, 88)}`;
    case 'conference-table':
      return `width=${discreteWithCanonical(params, 'width', 84, 120, 4, 110)};chairs=${discrete(params, 'chairs', 0, 8, 1, 6)}`;
    case 'supply-cabinet':
      return `height=${discrete(params, 'height', 60, 84, 2, 72)}`;
    case 'desk-lamp':
      return `size=${discrete(params, 'size', 26, 40, 2, 32)}`;
    case 'desk-clutter':
      return `papers=${discrete(params, 'papers', 1, 4, 1, 3)};phone=${discrete(params, 'phone', 0, 1, 1, 1)}`;
    case 'couch':
      return `width=${discrete(params, 'width', 62, 98, 4, 82)};cushions=${discrete(params, 'cushions', 2, 3, 1, 3)}`;
    case 'waiting-bench':
      return `length=${discrete(params, 'length', 76, 112, 4, 96)};seats=${discrete(params, 'seats', 2, 4, 1, 3)}`;
    case 'coffee-table':
      return `width=${discreteWithCanonical(params, 'width', 48, 76, 4, 62)};decor=${discrete(params, 'decor', 0, 2, 1, 2)}`;
    case 'break-table':
      return `diameter=${discrete(params, 'diameter', 40, 64, 4, 52)};stools=${discrete(params, 'stools', 2, 4, 1, 4)}`;
    case 'lounge-seating':
      return `seats=${discrete(params, 'seats', 2, 4, 1, 3)}`;
    case 'bean-bag':
      return `size=${discrete(params, 'size', 34, 48, 2, 42)}`;
    case 'nap-pod':
      return `visor=${discrete(params, 'visor', 0, 1, 1, 1)}`;
    case 'bookshelf':
    case 'open-shelving':
      return `shelves=${discrete(params, 'shelves', 3, 5, 1, 4)};fill=${discrete(params, 'fill', 1, 3, 1, 3)}`;
    case 'lockers':
      return `columns=${discrete(params, 'columns', 2, 4, 1, 3)};height=${discrete(params, 'height', 72, 92, 2, 84)}`;
    case 'pantry-shelf':
      return `shelves=${discrete(params, 'shelves', 2, 4, 1, 3)}`;
    case 'mail-station':
      return `height=${discrete(params, 'height', 48, 72, 2, 60)};columns=${discrete(params, 'columns', 3, 5, 1, 4)}`;
    case 'server-rack':
      return `height=${discrete(params, 'height', 72, 94, 2, 86)};units=${discrete(params, 'units', 3, 6, 1, 5)}`;
    case 'coat-rack':
      return `hooks=${discrete(params, 'hooks', 2, 5, 1, 4)}`;
    case 'potted-tree':
      return `height=${discrete(params, 'height', 74, 100, 2, 90)};fullness=${discrete(params, 'fullness', 1, 3, 1, 2)}`;
    case 'hanging-plant':
      return `trail=${discrete(params, 'trail', 14, 34, 2, 24)};fullness=${discrete(params, 'fullness', 1, 3, 1, 2)}`;
    case 'floor-lamp':
      return `height=${discrete(params, 'height', 78, 104, 2, 92)}`;
    case 'framed-art':
      return `width=${discrete(params, 'width', 28, 46, 2, 36)};scene=${discrete(params, 'scene', 0, 2, 1, 1)}`;
    case 'poster':
      return `lines=${discrete(params, 'lines', 1, 3, 1, 2)}`;
    case 'wall-clock':
      return `time=${discrete(params, 'time', 0, 11, 1, 10)}`;
    case 'fish-tank':
      return `fish=${discrete(params, 'fish', 1, 4, 1, 3)}`;
    case 'string-lights':
      return `bulbs=${discrete(params, 'bulbs', 4, 8, 1, 6)}`;
    case 'rug':
      return `width=${discrete(params, 'width', 72, 112, 4, 96)};pattern=${discrete(params, 'pattern', 0, 2, 1, 1)}`;
    case 'car':
      return `trim=${discrete(params, 'trim', 0, 1, 1, 1)}`;
    case 'sign-lot':
      return `variant=${discrete(params, 'variant', 0, 1, 1, 0)}`;
    case 'tree-canopy': {
      const lobes = discrete(params, 'lobes', 5, 9, 1, 7);
      const seed = discrete(params, 'seed', 1, 9, 1, 3);
      const habit = params.habit === undefined && lobes === 6 && seed === 7
        ? 1
        : discrete(params, 'habit', 0, 3, 1, 0);
      return (
        `habit=${habit};` +
        `lobes=${lobes};` +
        `seed=${seed}`
      );
    }
    default:
      return '';
  }
}

/**
 * Resolve deterministic, build-time compiled SVG artwork for an existing prop
 * template. IDs, params, palettes, footprints, and registration stay owned by
 * the handwritten PropTemplate.
 */
export function authoredPropShapes(
  id: string,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const art = ART_BY_ID.get(id);
  if (!art) return [];
  const key = variantKey(id, params);
  const shapes = art.variants[key];
  if (!shapes) throw new Error(`Missing authored prop variant ${id}/${key}`);
  return shapes.map((shape) => ({ ...shape }));
}

export function authoredPropArt(id: string): ImportedPropArt | undefined {
  return ART_BY_ID.get(id);
}

/** Resolve a source-exact canonical SVG when an authored family supplies one. */
export function authoredPropSvg(
  id: string,
  params: Readonly<Record<string, number>>,
): string | undefined {
  const art = ART_BY_ID.get(id);
  if (!art?.sourceSvgVariants) return undefined;
  const key = variantKey(id, params);
  const svg = art.sourceSvgVariants[key];
  if (!svg) throw new Error(`Missing authored prop SVG variant ${id}/${key}`);
  return svg;
}
