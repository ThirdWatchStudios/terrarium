import type { ShapeSpec } from '../../src/core/types';
import { rr } from '../../src/core/geometry';

/**
 * QuotaCo high-oblique A1a geometry proof.
 *
 * This module is deliberately script-local. It produces review pixels and
 * evidence for a later contract discussion; it is not a production tile,
 * template, atlas, or export registration.
 */

export const A1A_CANVAS = 128;
export const A1A_ATLAS_COLUMNS = 8;
export const A1A_ATLAS_ROWS = 4;
export const A1A_ATLAS_PADDING = 8;
export const A1A_CELL_STRIDE = A1A_CANVAS + A1A_ATLAS_PADDING * 2;

export const A1A_RULER = {
  lowProfile: 22,
  fullProfile: 60,
  capPlane: 8,
  outline: 2,
  serviceSeam: 2,
  shellRadius: 9,
  doorwayClear: 88,
  floorSeam: 2,
  floorInlay: 7,
} as const;

export const A1A_REVIEW_SIZES = {
  close: 240,
  normal: 90,
  far: 40,
} as const;

export const A1A_PALETTE = {
  floor: '#AAA38F',
  floorAlternate: '#B9B19B',
  cream: '#D9D0B9',
  green: '#294B3C',
  teal: '#4E7D79',
  coral: '#B65F4D',
  charcoal: '#252A28',
  glass: '#83A9A6',
  metal: '#979A91',
} as const;

export type A1aPaletteToken = keyof typeof A1A_PALETTE;
export type A1aLayer =
  | 'floor'
  | 'monolith'
  | 'base'
  | 'upper'
  | 'opening'
  | 'literal';

export interface A1aShape extends ShapeSpec {
  layer: A1aLayer;
}

export const A1A_SHARED_FRAME_IDS = [
  'shared_floor_flat',
  'shared_floor_transition_straight',
  'shared_floor_transition_corner',
  'shared_floor_threshold',
  'shared_low_s_straight',
  'shared_low_e_straight',
  'shared_low_corner',
  'shared_low_terminus',
  'shared_partition_straight',
  'shared_partition_corner',
  'shared_structure_junction',
] as const;

export const A1A_COMPARISON_STEMS = [
  'full_n_straight',
  'full_w_straight',
  'full_exterior_corner',
  'full_terminus',
  'transition_n_to_e',
  'transition_w_to_s',
  'door_closed',
  'door_open',
  'window_wide',
] as const;

export type A1aSharedFrameId = (typeof A1A_SHARED_FRAME_IDS)[number];
export type A1aComparisonStem = (typeof A1A_COMPARISON_STEMS)[number];
export type A1aComparisonFrameId = `a_${A1aComparisonStem}` | `b_${A1aComparisonStem}`;
export type A1aFrameId = A1aSharedFrameId | A1aComparisonFrameId;
export type A1aConstruction = 'shared' | 'a-monolithic' | 'b-split';

export interface A1aProofFrame {
  id: A1aFrameId;
  label: string;
  construction: A1aConstruction;
  comparisonStem?: A1aComparisonStem;
  pivot: { x: 0.5; y: 0.5 };
  shapes: readonly A1aShape[];
}

export interface A1aAtlasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface A1aAtlasDescriptor {
  version: 0;
  status: 'proof-only';
  contract: false;
  name: 'QuotaCo high-oblique A1a A/B geometry proof';
  scale: number;
  canvas: number;
  frameSize: number;
  padding: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
  pivot: { x: 0.5; y: 0.5 };
  frames: Record<A1aFrameId, A1aAtlasRect & {
    label: string;
    construction: A1aConstruction;
    comparisonStem?: A1aComparisonStem;
    layers: A1aLayer[];
  }>;
  palette: typeof A1A_PALETTE;
  ruler: typeof A1A_RULER;
  meta: {
    generator: 'terrarium-proof-renderer';
    temporaryFrameIds: true;
    productionRegistration: false;
    directionalCastShadow: false;
    note: string;
  };
}

const C = A1A_CANVAS;
const DARK = A1A_PALETTE.charcoal;
const BASE_START = C - 32;
const BASE_END = BASE_START + A1A_RULER.lowProfile;
const FULL_START = BASE_END - A1A_RULER.fullProfile;
const UPPER_END = BASE_START + 2;
const CONNECT = 3;

function pathRect(x: number, y: number, width: number, height: number): string {
  return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
}

function polygon(points: readonly [number, number][]): string {
  return `${points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')} Z`;
}

function shape(
  layer: A1aLayer,
  d: string,
  fill?: string,
  options: Omit<A1aShape, 'layer' | 'd' | 'fill'> = {},
): A1aShape {
  return { layer, d, ...(fill === undefined ? {} : { fill }), ...options };
}

function rect(
  layer: A1aLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  options: Omit<A1aShape, 'layer' | 'd' | 'fill'> = {},
): A1aShape {
  return shape(layer, pathRect(x, y, width, height), fill, options);
}

function rounded(
  layer: A1aLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  options: Omit<A1aShape, 'layer' | 'd' | 'fill'> = {},
): A1aShape {
  return shape(layer, rr(x, y, width, height, radius), fill, options);
}

function line(
  layer: A1aLayer,
  d: string,
  stroke: string,
  strokeWidth: number,
  opacity = 1,
): A1aShape {
  return shape(layer, d, undefined, {
    stroke,
    strokeWidth,
    opacity,
    silhouette: false,
  });
}

function fastenersHorizontal(layer: A1aLayer, y: number, x0 = 15, x1 = 113): A1aShape[] {
  return [
    rounded(layer, x0 - 1.5, y - 1.5, 3, 3, 1.5, A1A_PALETTE.metal, { silhouette: false }),
    rounded(layer, x1 - 1.5, y - 1.5, 3, 3, 1.5, A1A_PALETTE.metal, { silhouette: false }),
  ];
}

function fastenersVertical(layer: A1aLayer, x: number, y0 = 15, y1 = 113): A1aShape[] {
  return [
    rounded(layer, x - 1.5, y0 - 1.5, 3, 3, 1.5, A1A_PALETTE.metal, { silhouette: false }),
    rounded(layer, x - 1.5, y1 - 1.5, 3, 3, 1.5, A1A_PALETTE.metal, { silhouette: false }),
  ];
}

function floorBase(fill: '$floor' | '$floorAlternate' = '$floor'): A1aShape[] {
  return [rect('floor', 0, 0, C, C, fill, { silhouette: false })];
}

function floorFlat(): A1aShape[] {
  return [
    ...floorBase(),
    line('floor', 'M 0 64 H 128', '#FFFFFF', A1A_RULER.floorSeam, 0.12),
    line('floor', 'M 64 0 V 128', A1A_PALETTE.charcoal, 1, 0.08),
  ];
}

function floorTransitionStraight(): A1aShape[] {
  return [
    ...floorBase(),
    rect('floor', 0, 65, C, 63, '$floorAlternate', { silhouette: false }),
    rect('floor', 0, 61, C, A1A_RULER.floorInlay, '$teal', { silhouette: false }),
    line('floor', 'M 0 60 H 128 M 0 69 H 128', A1A_PALETTE.charcoal, 1, 0.22),
  ];
}

function floorTransitionCorner(): A1aShape[] {
  return [
    ...floorBase(),
    rect('floor', 65, 65, 63, 63, '$floorAlternate', { silhouette: false }),
    shape(
      'floor',
      polygon([[61, 0], [68, 0], [68, 61], [128, 61], [128, 68], [61, 68]]),
      '$teal',
      { silhouette: false },
    ),
    line('floor', 'M 60 0 V 69 H 128', A1A_PALETTE.charcoal, 1, 0.22),
    line('floor', 'M 69 0 V 60 H 128', A1A_PALETTE.charcoal, 1, 0.22),
  ];
}

function floorThreshold(): A1aShape[] {
  return [
    ...floorBase('$floorAlternate'),
    rounded('floor', 12, 54, 104, 20, 4, '$green', { silhouette: false }),
    rounded('floor', 15, 57, 98, 14, 3, '$teal', { silhouette: false }),
    rect('floor', 19, 60, 90, 8, '$floor', { silhouette: false }),
    line('floor', 'M 19 59 H 109 M 19 69 H 109', A1A_PALETTE.charcoal, 1, 0.34),
  ];
}

function lowHorizontal(
  start = -CONNECT,
  end = C + CONNECT,
  cap: 'none' | 'right' = 'none',
  layer: A1aLayer = 'base',
  lightWeight = false,
): A1aShape[] {
  const width = end - start;
  const outer = cap === 'right'
    ? rounded(layer, start, BASE_START - 2, width, A1A_RULER.lowProfile + 4, A1A_RULER.shellRadius, DARK)
    : rect(layer, start, BASE_START - 2, width, A1A_RULER.lowProfile + 4, DARK);
  const material = cap === 'right'
    ? rounded(layer, start, BASE_START, width - 3, A1A_RULER.lowProfile, A1A_RULER.shellRadius - 2, lightWeight ? '$cream' : '$green')
    : rect(layer, start, BASE_START, width, A1A_RULER.lowProfile, lightWeight ? '$cream' : '$green');
  const out: A1aShape[] = [outer, material];
  out.push(rect(layer, start, BASE_START, Math.max(0, width - (cap === 'right' ? 4 : 0)), A1A_RULER.capPlane, '#FFFFFF', {
    opacity: lightWeight ? 0.14 : 0.1,
    silhouette: false,
  }));
  out.push(rect(layer, start, BASE_START + 9, Math.max(0, width - (cap === 'right' ? 5 : 0)), 5, '$teal', {
    opacity: lightWeight ? 0.55 : 0.9,
    silhouette: false,
  }));
  out.push(line(layer, `M ${start} ${BASE_START + 8} H ${end - (cap === 'right' ? 8 : 0)}`, A1A_PALETTE.charcoal, 1.5, 0.45));
  if (!lightWeight) out.push(...fastenersHorizontal(layer, BASE_START + 17, Math.max(start + 13, 15), Math.min(end - 15, 113)));
  return out;
}

function lowVertical(
  start = -CONNECT,
  end = C + CONNECT,
  cap: 'none' | 'bottom' = 'none',
  layer: A1aLayer = 'base',
  lightWeight = false,
): A1aShape[] {
  const height = end - start;
  const outer = cap === 'bottom'
    ? rounded(layer, BASE_START - 2, start, A1A_RULER.lowProfile + 4, height, A1A_RULER.shellRadius, DARK)
    : rect(layer, BASE_START - 2, start, A1A_RULER.lowProfile + 4, height, DARK);
  const material = cap === 'bottom'
    ? rounded(layer, BASE_START, start, A1A_RULER.lowProfile, height - 3, A1A_RULER.shellRadius - 2, lightWeight ? '$cream' : '$green')
    : rect(layer, BASE_START, start, A1A_RULER.lowProfile, height, lightWeight ? '$cream' : '$green');
  const out: A1aShape[] = [outer, material];
  out.push(rect(layer, BASE_START, start, A1A_RULER.capPlane, Math.max(0, height - (cap === 'bottom' ? 4 : 0)), '#FFFFFF', {
    opacity: lightWeight ? 0.14 : 0.1,
    silhouette: false,
  }));
  out.push(rect(layer, BASE_START + 9, start, 5, Math.max(0, height - (cap === 'bottom' ? 5 : 0)), '$teal', {
    opacity: lightWeight ? 0.55 : 0.9,
    silhouette: false,
  }));
  out.push(line(layer, `M ${BASE_START + 8} ${start} V ${end - (cap === 'bottom' ? 8 : 0)}`, A1A_PALETTE.charcoal, 1.5, 0.45));
  if (!lightWeight) out.push(...fastenersVertical(layer, BASE_START + 17, Math.max(start + 13, 15), Math.min(end - 15, 113)));
  return out;
}

function lowCorner(): A1aShape[] {
  const out = [...lowHorizontal(), ...lowVertical()];
  out.push(rounded('base', BASE_START, BASE_START, A1A_RULER.lowProfile, A1A_RULER.lowProfile, 5, '$green'));
  out.push(rounded('base', BASE_START + 9, BASE_START + 9, 5, 5, 2, '$teal', { silhouette: false }));
  return out;
}

function upperHorizontal(
  start = -CONNECT,
  end = C + CONNECT,
  cap: 'none' | 'right' = 'none',
  layer: A1aLayer = 'upper',
): A1aShape[] {
  const width = end - start;
  const height = UPPER_END - FULL_START;
  const outer = cap === 'right'
    ? rounded(layer, start, FULL_START - 2, width, height + 3, A1A_RULER.shellRadius, DARK)
    : rect(layer, start, FULL_START - 2, width, height + 3, DARK);
  const material = cap === 'right'
    ? rounded(layer, start, FULL_START, width - 3, height - 1, A1A_RULER.shellRadius - 2, '$cream')
    : rect(layer, start, FULL_START, width, height - 1, '$cream');
  return [
    outer,
    material,
    rect(layer, start, FULL_START, Math.max(0, width - (cap === 'right' ? 4 : 0)), A1A_RULER.capPlane, '#FFFFFF', { opacity: 0.2, silhouette: false }),
    rect(layer, start, FULL_START + A1A_RULER.capPlane, Math.max(0, width - (cap === 'right' ? 5 : 0)), height - A1A_RULER.capPlane - 3, '#000000', { opacity: 0.08, silhouette: false }),
    line(layer, `M ${start} ${FULL_START + A1A_RULER.capPlane} H ${end - (cap === 'right' ? 8 : 0)}`, A1A_PALETTE.charcoal, A1A_RULER.serviceSeam, 0.28),
    line(layer, `M ${start} ${UPPER_END - 2} H ${end - (cap === 'right' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.62),
  ];
}

function upperVertical(
  start = -CONNECT,
  end = C + CONNECT,
  cap: 'none' | 'bottom' = 'none',
  layer: A1aLayer = 'upper',
): A1aShape[] {
  const height = end - start;
  const width = UPPER_END - FULL_START;
  const outer = cap === 'bottom'
    ? rounded(layer, FULL_START - 2, start, width + 3, height, A1A_RULER.shellRadius, DARK)
    : rect(layer, FULL_START - 2, start, width + 3, height, DARK);
  const material = cap === 'bottom'
    ? rounded(layer, FULL_START, start, width - 1, height - 3, A1A_RULER.shellRadius - 2, '$cream')
    : rect(layer, FULL_START, start, width - 1, height, '$cream');
  return [
    outer,
    material,
    rect(layer, FULL_START, start, A1A_RULER.capPlane, Math.max(0, height - (cap === 'bottom' ? 4 : 0)), '#FFFFFF', { opacity: 0.2, silhouette: false }),
    rect(layer, FULL_START + A1A_RULER.capPlane, start, width - A1A_RULER.capPlane - 3, Math.max(0, height - (cap === 'bottom' ? 5 : 0)), '#000000', { opacity: 0.08, silhouette: false }),
    line(layer, `M ${FULL_START + A1A_RULER.capPlane} ${start} V ${end - (cap === 'bottom' ? 8 : 0)}`, A1A_PALETTE.charcoal, A1A_RULER.serviceSeam, 0.28),
    line(layer, `M ${UPPER_END - 2} ${start} V ${end - (cap === 'bottom' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.62),
  ];
}

function monolithicHorizontal(start = -CONNECT, end = C + CONNECT, cap: 'none' | 'right' = 'none'): A1aShape[] {
  const layer: A1aLayer = 'monolith';
  const width = end - start;
  const height = BASE_END - FULL_START;
  const outer = cap === 'right'
    ? rounded(layer, start, FULL_START - 2, width, height + 4, A1A_RULER.shellRadius, DARK)
    : rect(layer, start, FULL_START - 2, width, height + 4, DARK);
  const body = cap === 'right'
    ? rounded(layer, start, FULL_START, width - 3, height, A1A_RULER.shellRadius - 2, '$cream')
    : rect(layer, start, FULL_START, width, height, '$cream');
  return [
    outer,
    body,
    rect(layer, start, FULL_START, Math.max(0, width - (cap === 'right' ? 4 : 0)), A1A_RULER.capPlane, '#FFFFFF', { opacity: 0.2, silhouette: false }),
    rect(layer, start, FULL_START + A1A_RULER.capPlane, Math.max(0, width - (cap === 'right' ? 5 : 0)), BASE_START - FULL_START - A1A_RULER.capPlane, '#000000', { opacity: 0.08, silhouette: false }),
    rect(layer, start, BASE_START, Math.max(0, width - (cap === 'right' ? 4 : 0)), A1A_RULER.lowProfile, '$green', { silhouette: false }),
    rect(layer, start, BASE_START + 9, Math.max(0, width - (cap === 'right' ? 5 : 0)), 5, '$teal', { silhouette: false }),
    line(layer, `M ${start} ${FULL_START + A1A_RULER.capPlane} H ${end - (cap === 'right' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.28),
    line(layer, `M ${start} ${BASE_START} H ${end - (cap === 'right' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.42),
    ...fastenersHorizontal(layer, BASE_START + 17, Math.max(start + 13, 15), Math.min(end - 15, 113)),
  ];
}

function monolithicVertical(start = -CONNECT, end = C + CONNECT, cap: 'none' | 'bottom' = 'none'): A1aShape[] {
  const layer: A1aLayer = 'monolith';
  const height = end - start;
  const width = BASE_END - FULL_START;
  const outer = cap === 'bottom'
    ? rounded(layer, FULL_START - 2, start, width + 4, height, A1A_RULER.shellRadius, DARK)
    : rect(layer, FULL_START - 2, start, width + 4, height, DARK);
  const body = cap === 'bottom'
    ? rounded(layer, FULL_START, start, width, height - 3, A1A_RULER.shellRadius - 2, '$cream')
    : rect(layer, FULL_START, start, width, height, '$cream');
  return [
    outer,
    body,
    rect(layer, FULL_START, start, A1A_RULER.capPlane, Math.max(0, height - (cap === 'bottom' ? 4 : 0)), '#FFFFFF', { opacity: 0.2, silhouette: false }),
    rect(layer, FULL_START + A1A_RULER.capPlane, start, BASE_START - FULL_START - A1A_RULER.capPlane, Math.max(0, height - (cap === 'bottom' ? 5 : 0)), '#000000', { opacity: 0.08, silhouette: false }),
    rect(layer, BASE_START, start, A1A_RULER.lowProfile, Math.max(0, height - (cap === 'bottom' ? 4 : 0)), '$green', { silhouette: false }),
    rect(layer, BASE_START + 9, start, 5, Math.max(0, height - (cap === 'bottom' ? 5 : 0)), '$teal', { silhouette: false }),
    line(layer, `M ${FULL_START + A1A_RULER.capPlane} ${start} V ${end - (cap === 'bottom' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.28),
    line(layer, `M ${BASE_START} ${start} V ${end - (cap === 'bottom' ? 8 : 0)}`, A1A_PALETTE.charcoal, 2, 0.42),
    ...fastenersVertical(layer, BASE_START + 17, Math.max(start + 13, 15), Math.min(end - 15, 113)),
  ];
}

function fullHorizontal(construction: 'a' | 'b', start = -CONNECT, end = C + CONNECT, cap: 'none' | 'right' = 'none'): A1aShape[] {
  return construction === 'a'
    ? monolithicHorizontal(start, end, cap)
    : [...lowHorizontal(start, end, cap, 'base'), ...upperHorizontal(start, end, cap, 'upper')];
}

function fullVertical(construction: 'a' | 'b', start = -CONNECT, end = C + CONNECT, cap: 'none' | 'bottom' = 'none'): A1aShape[] {
  return construction === 'a'
    ? monolithicVertical(start, end, cap)
    : [...lowVertical(start, end, cap, 'base'), ...upperVertical(start, end, cap, 'upper')];
}

function fullCorner(construction: 'a' | 'b'): A1aShape[] {
  const shapes = [...fullHorizontal(construction), ...fullVertical(construction)];
  const layer: A1aLayer = construction === 'a' ? 'monolith' : 'upper';
  shapes.push(rounded(layer, FULL_START, FULL_START, UPPER_END - FULL_START, UPPER_END - FULL_START, 7, '$cream'));
  shapes.push(rounded(construction === 'a' ? 'monolith' : 'base', BASE_START, BASE_START, A1A_RULER.lowProfile, A1A_RULER.lowProfile, 5, '$green'));
  shapes.push(line('literal', `M ${FULL_START + 9} ${FULL_START + 9} L ${UPPER_END - 5} ${UPPER_END - 5}`, A1A_PALETTE.charcoal, 1.5, 0.28));
  return shapes;
}

function transitionNorthToEast(construction: 'a' | 'b'): A1aShape[] {
  const shapes = [
    ...fullHorizontal(construction, -CONNECT, BASE_END + 1, 'right'),
    ...lowVertical(BASE_START - 2, C + CONNECT, 'none', construction === 'a' ? 'monolith' : 'base'),
  ];
  shapes.push(rounded(construction === 'a' ? 'monolith' : 'base', BASE_START, BASE_START, A1A_RULER.lowProfile, A1A_RULER.lowProfile, 5, '$green'));
  shapes.push(line('literal', `M ${BASE_START + 9} ${BASE_START + 9} L ${BASE_END - 4} ${BASE_END - 4}`, A1A_PALETTE.charcoal, 1.5, 0.28));
  return shapes;
}

function transitionWestToSouth(construction: 'a' | 'b'): A1aShape[] {
  const shapes = [
    ...fullVertical(construction, -CONNECT, BASE_END + 1, 'bottom'),
    ...lowHorizontal(BASE_START - 2, C + CONNECT, 'none', construction === 'a' ? 'monolith' : 'base'),
  ];
  shapes.push(rounded(construction === 'a' ? 'monolith' : 'base', BASE_START, BASE_START, A1A_RULER.lowProfile, A1A_RULER.lowProfile, 5, '$green'));
  shapes.push(line('literal', `M ${BASE_START + 9} ${BASE_START + 9} L ${BASE_END - 4} ${BASE_END - 4}`, A1A_PALETTE.charcoal, 1.5, 0.28));
  return shapes;
}

const DOOR_LEFT = (C - A1A_RULER.doorwayClear) / 2;
const DOOR_RIGHT = C - DOOR_LEFT;

function doorFrame(construction: 'a' | 'b', open: boolean): A1aShape[] {
  const shapes = [
    ...fullHorizontal(construction, -CONNECT, DOOR_LEFT + 8, 'right'),
    ...fullHorizontal(construction, DOOR_RIGHT - 8, C + CONNECT, 'none'),
  ];
  const wallLayer: A1aLayer = construction === 'a' ? 'monolith' : 'upper';
  const baseLayer: A1aLayer = construction === 'a' ? 'monolith' : 'base';
  shapes.push(rounded(wallLayer, DOOR_LEFT - 2, FULL_START + 3, 13, BASE_START - FULL_START + 5, 5, DARK));
  shapes.push(rounded(wallLayer, DOOR_RIGHT - 11, FULL_START + 3, 13, BASE_START - FULL_START + 5, 5, DARK));
  shapes.push(rounded(wallLayer, DOOR_LEFT + 1, FULL_START + 6, 8, BASE_START - FULL_START, 3, '$cream'));
  shapes.push(rounded(wallLayer, DOOR_RIGHT - 8, FULL_START + 6, 8, BASE_START - FULL_START, 3, '$cream'));
  shapes.push(rounded(baseLayer, DOOR_LEFT, BASE_END - 8, A1A_RULER.doorwayClear, 8, 3, DARK));
  shapes.push(rounded(baseLayer, DOOR_LEFT + 3, BASE_END - 6, A1A_RULER.doorwayClear - 6, 4, 2, '$teal', { silhouette: false }));

  if (open) {
    shapes.push(rounded('opening', DOOR_LEFT + 8, FULL_START + 11, 12, BASE_END - FULL_START - 11, 4, DARK));
    shapes.push(rounded('opening', DOOR_LEFT + 10, FULL_START + 13, 8, BASE_END - FULL_START - 15, 3, '$cream'));
    shapes.push(rounded('opening', DOOR_LEFT + 11, BASE_START + 1, 6, 8, 2, '$green', { silhouette: false }));
    shapes.push(rounded('literal', DOOR_LEFT + 14, BASE_START - 9, 4, 4, 2, A1A_PALETTE.coral, { silhouette: false }));
  } else {
    shapes.push(rounded('opening', DOOR_LEFT + 8, FULL_START + 9, A1A_RULER.doorwayClear - 16, BASE_END - FULL_START - 10, 6, DARK));
    shapes.push(rounded('opening', DOOR_LEFT + 11, FULL_START + 12, A1A_RULER.doorwayClear - 22, BASE_END - FULL_START - 16, 4, '$cream'));
    shapes.push(rounded('opening', DOOR_LEFT + 14, BASE_START - 1, A1A_RULER.doorwayClear - 28, 14, 3, '$green', { silhouette: false }));
    shapes.push(rounded('opening', DOOR_LEFT + 18, FULL_START + 20, A1A_RULER.doorwayClear - 36, 15, 4, '$teal', { opacity: 0.7, silhouette: false }));
    shapes.push(line('literal', `M 64 ${FULL_START + 13} V ${BASE_END - 6}`, A1A_PALETTE.charcoal, 2, 0.32));
    shapes.push(rounded('literal', 68, BASE_START - 12, 5, 5, 2.5, A1A_PALETTE.coral, { silhouette: false }));
  }
  return shapes;
}

function wideWindow(construction: 'a' | 'b'): A1aShape[] {
  const shapes = fullHorizontal(construction);
  const layer: A1aLayer = construction === 'a' ? 'monolith' : 'upper';
  shapes.push(rounded('opening', 17, FULL_START + 7, 94, 34, 7, DARK));
  shapes.push(rounded('opening', 21, FULL_START + 11, 86, 26, 5, A1A_PALETTE.glass, { silhouette: false }));
  shapes.push(rect('opening', 61, FULL_START + 11, 6, 26, '$cream', { silhouette: false }));
  shapes.push(rect('opening', 21, FULL_START + 22, 86, 5, '$cream', { silhouette: false }));
  shapes.push(line('literal', `M 27 ${FULL_START + 16} H 53`, '#FFFFFF', 2, 0.46));
  shapes.push(rounded(layer, 14, FULL_START + 39, 100, 8, 3, '$cream', { silhouette: false }));
  shapes.push(...fastenersHorizontal('literal', FULL_START + 43, 23, 105));
  return shapes;
}

function partitionStraight(): A1aShape[] {
  return lowHorizontal(-CONNECT, C + CONNECT, 'none', 'base', true);
}

function partitionCorner(): A1aShape[] {
  const shapes = [
    ...lowHorizontal(-CONNECT, C + CONNECT, 'none', 'base', true),
    ...lowVertical(-CONNECT, C + CONNECT, 'none', 'base', true),
  ];
  shapes.push(rounded('base', BASE_START, BASE_START, A1A_RULER.lowProfile, A1A_RULER.lowProfile, 5, '$cream'));
  shapes.push(rounded('base', BASE_START + 8, BASE_START + 8, 6, 6, 2, '$teal', { silhouette: false }));
  return shapes;
}

function structureJunction(): A1aShape[] {
  const shapes = [
    ...lowHorizontal(-CONNECT, C + CONNECT),
    ...lowVertical(-CONNECT, BASE_START + 5, 'bottom'),
  ];
  shapes.push(rounded('upper', 77, 51, 42, 68, 9, DARK));
  shapes.push(rounded('upper', 80, 54, 36, 61, 7, '$cream'));
  shapes.push(rect('upper', 80, 54, 8, 61, '#FFFFFF', { opacity: 0.17, silhouette: false }));
  shapes.push(rounded('opening', 88, 68, 20, 30, 5, '$teal', { opacity: 0.72, silhouette: false }));
  shapes.push(line('literal', 'M 92 60 H 108 M 92 105 H 108', A1A_PALETTE.charcoal, 2, 0.38));
  shapes.push(rounded('literal', 108, 59, 4, 4, 2, A1A_PALETTE.coral, { silhouette: false }));
  return shapes;
}

const SHARED_BUILDERS: Readonly<Record<A1aSharedFrameId, () => A1aShape[]>> = {
  shared_floor_flat: floorFlat,
  shared_floor_transition_straight: floorTransitionStraight,
  shared_floor_transition_corner: floorTransitionCorner,
  shared_floor_threshold: floorThreshold,
  shared_low_s_straight: () => lowHorizontal(),
  shared_low_e_straight: () => lowVertical(),
  shared_low_corner: lowCorner,
  shared_low_terminus: () => lowHorizontal(-CONNECT, 112, 'right'),
  shared_partition_straight: partitionStraight,
  shared_partition_corner: partitionCorner,
  shared_structure_junction: structureJunction,
};

const SHARED_LABELS: Readonly<Record<A1aSharedFrameId, string>> = {
  shared_floor_flat: 'Flat floor',
  shared_floor_transition_straight: 'Floor transition — straight',
  shared_floor_transition_corner: 'Floor transition — corner',
  shared_floor_threshold: 'Doorway threshold',
  shared_low_s_straight: 'Low south wall — straight',
  shared_low_e_straight: 'Low east wall — straight',
  shared_low_corner: 'Low wall — corner',
  shared_low_terminus: 'Low wall — terminus',
  shared_partition_straight: 'Internal partition — straight',
  shared_partition_corner: 'Internal partition — corner',
  shared_structure_junction: 'Service-chase T-junction',
};

function comparisonShapes(stem: A1aComparisonStem, construction: 'a' | 'b'): A1aShape[] {
  switch (stem) {
    case 'full_n_straight': return fullHorizontal(construction);
    case 'full_w_straight': return fullVertical(construction);
    case 'full_exterior_corner': return fullCorner(construction);
    case 'full_terminus': return fullHorizontal(construction, -CONNECT, 112, 'right');
    case 'transition_n_to_e': return transitionNorthToEast(construction);
    case 'transition_w_to_s': return transitionWestToSouth(construction);
    case 'door_closed': return doorFrame(construction, false);
    case 'door_open': return doorFrame(construction, true);
    case 'window_wide': return wideWindow(construction);
  }
}

const COMPARISON_LABELS: Readonly<Record<A1aComparisonStem, string>> = {
  full_n_straight: 'Full north wall — straight',
  full_w_straight: 'Full west wall — straight',
  full_exterior_corner: 'Full wall — exterior corner',
  full_terminus: 'Full wall — terminus',
  transition_n_to_e: 'Full north → low east',
  transition_w_to_s: 'Full west → low south',
  door_closed: 'Directional door — closed',
  door_open: 'Directional door — open',
  window_wide: 'Full wall — wide window',
};

function frame(
  id: A1aFrameId,
  label: string,
  construction: A1aConstruction,
  shapes: readonly A1aShape[],
  comparisonStem?: A1aComparisonStem,
): A1aProofFrame {
  return {
    id,
    label,
    construction,
    ...(comparisonStem === undefined ? {} : { comparisonStem }),
    pivot: { x: 0.5, y: 0.5 },
    shapes,
  };
}

const sharedFrames = A1A_SHARED_FRAME_IDS.map((id) =>
  frame(id, SHARED_LABELS[id], 'shared', SHARED_BUILDERS[id]()));
const aFrames = A1A_COMPARISON_STEMS.map((stem) =>
  frame(`a_${stem}`, COMPARISON_LABELS[stem], 'a-monolithic', comparisonShapes(stem, 'a'), stem));
const bFrames = A1A_COMPARISON_STEMS.map((stem) =>
  frame(`b_${stem}`, COMPARISON_LABELS[stem], 'b-split', comparisonShapes(stem, 'b'), stem));

export const A1A_PROOF_FRAMES: readonly A1aProofFrame[] = [
  ...sharedFrames,
  ...aFrames,
  ...bFrames,
];

const frameById = new Map(A1A_PROOF_FRAMES.map((entry) => [entry.id, entry]));
const A1A_LAYER_ORDER: readonly A1aLayer[] = [
  'floor',
  'monolith',
  'base',
  'upper',
  'opening',
  'literal',
];

export function getA1aProofFrame(id: A1aFrameId): A1aProofFrame {
  const found = frameById.get(id);
  if (!found) throw new Error(`Unknown A1a proof frame ${id}`);
  return found;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function resolveA1aPaint(value: string): string {
  if (!value.startsWith('$')) return value;
  const token = value.slice(1) as A1aPaletteToken;
  return A1A_PALETTE[token] ?? '#FF00FF';
}

export function a1aShapeMarkup(shapeSpec: A1aShape): string {
  const attributes = [
    `d="${escapeAttribute(shapeSpec.d)}"`,
    `fill="${shapeSpec.fill === undefined ? 'none' : resolveA1aPaint(shapeSpec.fill)}"`,
  ];
  if (shapeSpec.stroke !== undefined) {
    attributes.push(`stroke="${resolveA1aPaint(shapeSpec.stroke)}"`);
    attributes.push(`stroke-width="${shapeSpec.strokeWidth ?? 1.5}"`);
    attributes.push('stroke-linecap="round" stroke-linejoin="round"');
  }
  if (shapeSpec.opacity !== undefined) attributes.push(`opacity="${shapeSpec.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

export function a1aFrameMarkup(
  frameOrId: A1aProofFrame | A1aFrameId,
  layers?: readonly A1aLayer[],
): string {
  const proofFrame = typeof frameOrId === 'string' ? getA1aProofFrame(frameOrId) : frameOrId;
  const allowed = layers === undefined ? undefined : new Set(layers);
  return A1A_LAYER_ORDER.flatMap((layer) =>
    proofFrame.shapes.filter((entry) => entry.layer === layer && (allowed === undefined || allowed.has(layer))))
    .map(a1aShapeMarkup)
    .join('');
}

export function a1aFrameSvg(
  frameOrId: A1aProofFrame | A1aFrameId,
  pixelSize = A1A_CANVAS,
  layers?: readonly A1aLayer[],
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1A_CANVAS} ${A1A_CANVAS}">` +
    a1aFrameMarkup(frameOrId, layers) +
    '</svg>'
  );
}

export function a1aAtlasDescriptor(scale: number): A1aAtlasDescriptor {
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`Invalid A1a proof scale ${scale}`);
  const stride = A1A_CELL_STRIDE * scale;
  const frameSize = A1A_CANVAS * scale;
  const padding = A1A_ATLAS_PADDING * scale;
  const frames = Object.fromEntries(A1A_PROOF_FRAMES.map((entry, index) => {
    const layers = [...new Set(entry.shapes.map((candidate) => candidate.layer))];
    return [entry.id, {
      x: (index % A1A_ATLAS_COLUMNS) * stride + padding,
      y: Math.floor(index / A1A_ATLAS_COLUMNS) * stride + padding,
      w: frameSize,
      h: frameSize,
      label: entry.label,
      construction: entry.construction,
      ...(entry.comparisonStem === undefined ? {} : { comparisonStem: entry.comparisonStem }),
      layers,
    }];
  })) as A1aAtlasDescriptor['frames'];
  return {
    version: 0,
    status: 'proof-only',
    contract: false,
    name: 'QuotaCo high-oblique A1a A/B geometry proof',
    scale,
    canvas: A1A_CANVAS,
    frameSize,
    padding,
    columns: A1A_ATLAS_COLUMNS,
    rows: A1A_ATLAS_ROWS,
    width: A1A_ATLAS_COLUMNS * stride,
    height: A1A_ATLAS_ROWS * stride,
    pivot: { x: 0.5, y: 0.5 },
    frames,
    palette: A1A_PALETTE,
    ruler: A1A_RULER,
    meta: {
      generator: 'terrarium-proof-renderer',
      temporaryFrameIds: true,
      productionRegistration: false,
      directionalCastShadow: false,
      note: 'A1a visual evidence only. Do not consume as the production wall or facility contract.',
    },
  };
}

export function a1aAtlasSvg(scale: number): string {
  const atlas = a1aAtlasDescriptor(scale);
  const cells = A1A_PROOF_FRAMES.map((entry) => {
    const frameRect = atlas.frames[entry.id];
    return (
      `<svg x="${frameRect.x}" y="${frameRect.y}" width="${frameRect.w}" height="${frameRect.h}" ` +
      `viewBox="0 0 ${A1A_CANVAS} ${A1A_CANVAS}">` +
      a1aFrameMarkup(entry) +
      '</svg>'
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" ` +
    `viewBox="0 0 ${atlas.width} ${atlas.height}">${cells}</svg>`
  );
}

export function a1aComponentLayers(frame: A1aProofFrame): {
  base: readonly A1aLayer[];
  upper: readonly A1aLayer[];
} {
  if (frame.construction !== 'b-split') throw new Error(`${frame.id} is not a split-B frame`);
  return {
    base: ['base'],
    upper: ['upper', 'opening', 'literal'],
  };
}
