import type { ShapeSpec } from '../../src/core/types';
import { A1A_PALETTE } from './a1aProof';

/**
 * Proof-only composition for the first authored QuotaCo Building System pass.
 *
 * The checked-in SVG components remain the art authority. This module only
 * orders their compiled ShapeSpecs, renders transparent review frames, and
 * records evidence for the later 47-blob expansion/contract discussion.
 */

export const A1B_CANVAS = 128;
export const A1B_ATLAS_COLUMNS = 6;
export const A1B_ATLAS_ROWS = 5;
export const A1B_ATLAS_PADDING = 8;
export const A1B_CELL_STRIDE = A1B_CANVAS + A1B_ATLAS_PADDING * 2;

export const A1B_AUTHORED_STEMS = [
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

export type A1bAuthoredStem = (typeof A1B_AUTHORED_STEMS)[number];
export type A1bAuthoredComponentKind = 'base' | 'upper';
export type A1bAuthoredFrameKind = A1bAuthoredComponentKind | 'composed';
export type A1bAuthoredFrameId = `b_${A1bAuthoredStem}_${A1bAuthoredFrameKind}`;

export interface A1bCompiledComponentLike {
  readonly id: string;
  readonly frameId: string;
  readonly stem: string;
  readonly component: A1bAuthoredComponentKind;
  readonly sourceFile: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface A1bAuthoredFrame {
  readonly id: A1bAuthoredFrameId;
  readonly stem: A1bAuthoredStem;
  readonly kind: A1bAuthoredFrameKind;
  readonly shapes: readonly ShapeSpec[];
  readonly sourceFiles: readonly string[];
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
}

export interface A1bAtlasRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface A1bAuthoredAtlasDescriptor {
  readonly version: 0;
  readonly status: 'authored-source-proof';
  readonly contract: false;
  readonly name: 'QuotaCo high-oblique A1b authored B source pass';
  readonly scale: number;
  readonly canvas: number;
  readonly frameSize: number;
  readonly padding: number;
  readonly columns: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly frames: Record<A1bAuthoredFrameId, A1bAtlasRect & {
    readonly stem: A1bAuthoredStem;
    readonly kind: A1bAuthoredFrameKind;
    readonly sourceFiles: readonly string[];
  }>;
  readonly meta: {
    readonly generator: 'terrarium-authored-source-proof';
    readonly temporaryFrameIds: true;
    readonly productionRegistration: false;
    readonly completeBlobFamily: false;
    readonly directionalCastShadow: false;
    readonly note: string;
  };
}

function isAuthoredStem(value: string): value is A1bAuthoredStem {
  return (A1B_AUTHORED_STEMS as readonly string[]).includes(value);
}

function cloneShapes(shapes: readonly ShapeSpec[]): ShapeSpec[] {
  return shapes.map((shape) => ({ ...shape }));
}

/** Build the deterministic base, upper, composed order used by the atlas. */
export function buildA1bAuthoredFrames(
  components: readonly A1bCompiledComponentLike[],
): readonly A1bAuthoredFrame[] {
  const byKey = new Map<string, A1bCompiledComponentLike>();
  for (const component of components) {
    if (!isAuthoredStem(component.stem)) {
      throw new Error(`Unknown A1b authored stem ${component.stem}`);
    }
    const key = `${component.stem}/${component.component}`;
    if (byKey.has(key)) throw new Error(`Duplicate A1b authored component ${key}`);
    byKey.set(key, component);
  }

  const frames: A1bAuthoredFrame[] = [];
  for (const stem of A1B_AUTHORED_STEMS) {
    const base = byKey.get(`${stem}/base`);
    const upper = byKey.get(`${stem}/upper`);
    if (!base || !upper) throw new Error(`A1b authored stem ${stem} requires base and upper sources`);
    const baseShapes = cloneShapes(base.shapes);
    const upperShapes = cloneShapes(upper.shapes);
    frames.push(
      {
        id: `b_${stem}_base`,
        stem,
        kind: 'base',
        shapes: baseShapes,
        sourceFiles: [base.sourceFile],
        pivot: { x: 0.5, y: 0.5 },
      },
      {
        id: `b_${stem}_upper`,
        stem,
        kind: 'upper',
        shapes: upperShapes,
        sourceFiles: [upper.sourceFile],
        pivot: { x: 0.5, y: 0.5 },
      },
      {
        id: `b_${stem}_composed`,
        stem,
        kind: 'composed',
        shapes: [...cloneShapes(base.shapes), ...cloneShapes(upper.shapes)],
        sourceFiles: [base.sourceFile, upper.sourceFile],
        pivot: { x: 0.5, y: 0.5 },
      },
    );
  }
  if (byKey.size !== components.length || frames.length !== A1B_AUTHORED_STEMS.length * 3) {
    throw new Error('A1b authored component inventory is inconsistent');
  }
  return frames;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function resolveAuthoredPaint(value: string): string {
  if (!value.startsWith('$')) return value;
  const token = value.slice(1) as 'cream' | 'green' | 'teal';
  const resolved = A1A_PALETTE[token];
  if (!resolved) throw new Error(`Unknown A1b authored palette token ${value}`);
  return resolved;
}

export function a1bAuthoredShapeMarkup(shape: ShapeSpec): string {
  const attributes = [
    `d="${escapeAttribute(shape.d)}"`,
    `fill="${shape.fill === undefined ? 'none' : escapeAttribute(resolveAuthoredPaint(shape.fill))}"`,
  ];
  if (shape.stroke !== undefined) {
    attributes.push(`stroke="${escapeAttribute(resolveAuthoredPaint(shape.stroke))}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push('stroke-linecap="round" stroke-linejoin="round"');
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

export function a1bAuthoredFrameMarkup(frame: A1bAuthoredFrame): string {
  return frame.shapes.map(a1bAuthoredShapeMarkup).join('');
}

export function a1bAuthoredFrameSvg(
  frame: A1bAuthoredFrame,
  pixelSize = A1B_CANVAS,
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1B_CANVAS} ${A1B_CANVAS}">` +
    a1bAuthoredFrameMarkup(frame) +
    '</svg>'
  );
}

export function a1bAuthoredAtlasDescriptor(
  frames: readonly A1bAuthoredFrame[],
  scale: number,
): A1bAuthoredAtlasDescriptor {
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`Invalid A1b proof scale ${scale}`);
  if (frames.length !== A1B_AUTHORED_STEMS.length * 3) {
    throw new Error(`A1b authored atlas requires 27 frames; received ${frames.length}`);
  }
  const stride = A1B_CELL_STRIDE * scale;
  const frameSize = A1B_CANVAS * scale;
  const padding = A1B_ATLAS_PADDING * scale;
  const entries = frames.map((frame, index) => [frame.id, {
    x: (index % A1B_ATLAS_COLUMNS) * stride + padding,
    y: Math.floor(index / A1B_ATLAS_COLUMNS) * stride + padding,
    w: frameSize,
    h: frameSize,
    stem: frame.stem,
    kind: frame.kind,
    sourceFiles: frame.sourceFiles,
  }] as const);
  const frameIds = entries.map(([id]) => id);
  if (new Set(frameIds).size !== frameIds.length) throw new Error('A1b atlas frame IDs must be unique');
  return {
    version: 0,
    status: 'authored-source-proof',
    contract: false,
    name: 'QuotaCo high-oblique A1b authored B source pass',
    scale,
    canvas: A1B_CANVAS,
    frameSize,
    padding,
    columns: A1B_ATLAS_COLUMNS,
    rows: A1B_ATLAS_ROWS,
    width: A1B_ATLAS_COLUMNS * stride,
    height: A1B_ATLAS_ROWS * stride,
    pivot: { x: 0.5, y: 0.5 },
    frames: Object.fromEntries(entries) as A1bAuthoredAtlasDescriptor['frames'],
    meta: {
      generator: 'terrarium-authored-source-proof',
      temporaryFrameIds: true,
      productionRegistration: false,
      completeBlobFamily: false,
      directionalCastShadow: false,
      note: 'First authored B appearance pass only. Expand through the existing 47-blob topology after source-art review; do not consume as a production contract.',
    },
  };
}

export function a1bAuthoredAtlasSvg(
  frames: readonly A1bAuthoredFrame[],
  scale: number,
): string {
  const atlas = a1bAuthoredAtlasDescriptor(frames, scale);
  const cells = frames.map((frame) => {
    const frameRect = atlas.frames[frame.id];
    return (
      `<svg x="${frameRect.x}" y="${frameRect.y}" width="${frameRect.w}" height="${frameRect.h}" ` +
      `viewBox="0 0 ${A1B_CANVAS} ${A1B_CANVAS}">` +
      a1bAuthoredFrameMarkup(frame) +
      '</svg>'
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" ` +
    `viewBox="0 0 ${atlas.width} ${atlas.height}">${cells}</svg>`
  );
}
