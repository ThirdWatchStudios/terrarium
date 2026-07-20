import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import {
  A1A_PALETTE,
  type A1aLayer,
  type A1aShape,
} from './a1aProof';

/**
 * Proof-only compiler for the rejected-low-wall corrective mini-strip.
 *
 * This lane is intentionally separate from the existing 47-mask topology.
 * It proves a finished capped low wall before any source propagation, template
 * registration, schema decision, or Unity import.
 */

export const A1B_LOW_CORRECTION_CANVAS = 128;
export const A1B_LOW_CORRECTION_PADDING = 8;
export const A1B_LOW_CORRECTION_COLUMNS = 3;
export const A1B_LOW_CORRECTION_ROWS = 2;
export const A1B_LOW_CORRECTION_STRIDE =
  A1B_LOW_CORRECTION_CANVAS + A1B_LOW_CORRECTION_PADDING * 2;

export const A1B_LOW_CORRECTION_RULER = {
  outerStart: 82,
  innerStart: 84,
  topPlaneEnd: 92,
  copingEnd: 100,
  innerEnd: 118,
  outerEnd: 120,
  outerProfile: 38,
  materialProfile: 34,
} as const;

export const A1B_LOW_CORRECTION_SOURCE_IDS = [
  'low-s-straight',
  'low-e-straight',
  'low-se-corner',
  'transition-n-to-e-base',
  'transition-n-to-e-upper',
] as const;
export type A1bLowCorrectionSourceId =
  (typeof A1B_LOW_CORRECTION_SOURCE_IDS)[number];

export interface A1bLowCorrectionSourceSpec {
  readonly id: A1bLowCorrectionSourceId;
  readonly filename: `${A1bLowCorrectionSourceId}.svg`;
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/low' | 'detail/upper';
}

function sourceSpec(
  id: A1bLowCorrectionSourceId,
  layer: 'base' | 'upper',
): A1bLowCorrectionSourceSpec {
  return {
    id,
    filename: `${id}.svg`,
    layer,
    semanticGroup: layer === 'base' ? 'detail/low' : 'detail/upper',
  };
}

export const A1B_LOW_CORRECTION_SOURCE_INVENTORY:
readonly A1bLowCorrectionSourceSpec[] = [
  sourceSpec('low-s-straight', 'base'),
  sourceSpec('low-e-straight', 'base'),
  sourceSpec('low-se-corner', 'base'),
  sourceSpec('transition-n-to-e-base', 'base'),
  sourceSpec('transition-n-to-e-upper', 'upper'),
];

export interface CompiledA1bLowCorrectionSource
  extends A1bLowCorrectionSourceSpec {
  readonly sourceFile: string;
  readonly shapes: readonly A1aShape[];
}

export interface CompileA1bLowCorrectionOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bLowCorrectionImportError extends Error {
  constructor(message: string) {
    super(`A1b low-profile correction import: ${message}`);
    this.name = 'A1bLowCorrectionImportError';
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function repositoryPrefix(value: string): string {
  const normalized = value
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/\/$/, '');
  if (
    !normalized ||
    path.posix.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    throw new A1bLowCorrectionImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

const TOKEN_PAINTS = new Map<string, string>([
  [A1A_PALETTE.cream, '$cream'],
  [A1A_PALETTE.green, '$green'],
  [A1A_PALETTE.teal, '$teal'],
]);

const LITERAL_PAINTS = new Set([
  A1A_PALETTE.charcoal,
  A1A_PALETTE.coral,
  A1A_PALETTE.glass,
  A1A_PALETTE.metal,
  '#FFFFFF',
  '#000000',
]);

function remapPaint(
  sourceFile: string,
  shapeIndex: number,
  channel: 'fill' | 'stroke',
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const token = TOKEN_PAINTS.get(value);
  if (token !== undefined) return token;
  if (LITERAL_PAINTS.has(value)) return value;
  throw new A1bLowCorrectionImportError(
    `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${value}`,
  );
}

function paletteToken(value: string | undefined): string | undefined {
  return value?.startsWith('$') ? value : undefined;
}

function validatePaintPurity(
  sourceFile: string,
  shapeIndex: number,
  fill: string | undefined,
  stroke: string | undefined,
): void {
  const fillToken = paletteToken(fill);
  const strokeToken = paletteToken(stroke);
  if ((fillToken && stroke && !strokeToken) || (strokeToken && fill && !fillToken)) {
    throw new A1bLowCorrectionImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix recolorable and literal paint`,
    );
  }
  if (fillToken && strokeToken && fillToken !== strokeToken) {
    throw new A1bLowCorrectionImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix palette tokens ${fillToken} and ${strokeToken}`,
    );
  }
}

function compileSourceShapes(
  source: A1bLowCorrectionSourceSpec,
  sourceFile: string,
  input: string,
): A1aShape[] {
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(input)) {
    throw new A1bLowCorrectionImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }
  const compiled = compileAuthoredSvg(input, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  const shapes = compiled.map((entry, shapeIndex): A1aShape => {
    if (entry.silhouette !== false) {
      throw new A1bLowCorrectionImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must live under ${source.semanticGroup} art`,
      );
    }
    const fill = remapPaint(sourceFile, shapeIndex, 'fill', entry.fill);
    const stroke = remapPaint(sourceFile, shapeIndex, 'stroke', entry.stroke);
    validatePaintPurity(sourceFile, shapeIndex, fill, stroke);
    return {
      ...entry,
      layer: source.layer as A1aLayer,
      ...(fill === undefined ? {} : { fill }),
      ...(stroke === undefined ? {} : { stroke }),
    };
  });
  if (!shapes.some((shape) => paletteToken(shape.fill) || paletteToken(shape.stroke))) {
    throw new A1bLowCorrectionImportError(
      `${sourceFile} must contain at least one cream, green, or teal product field`,
    );
  }
  return shapes;
}

/** Compile exactly the five editable correction sources in stable order. */
export async function compileA1bLowCorrectionDirectory(
  options: CompileA1bLowCorrectionOptions,
): Promise<CompiledA1bLowCorrectionSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expectedFiles = new Set<string>(
    A1B_LOW_CORRECTION_SOURCE_INVENTORY.map((source) => source.filename),
  );
  const actualFiles = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expectedFiles.has(entry.name)) {
      throw new A1bLowCorrectionImportError(`unexpected source ${entry.name}`);
    }
    actualFiles.add(entry.name);
  }
  for (const expected of expectedFiles) {
    if (!actualFiles.has(expected)) {
      throw new A1bLowCorrectionImportError(`missing source ${expected}`);
    }
  }

  const compiled: CompiledA1bLowCorrectionSource[] = [];
  for (const source of A1B_LOW_CORRECTION_SOURCE_INVENTORY) {
    const sourceFile = `${prefix}/${source.filename}`;
    const input = await readFile(path.join(options.inputDir, source.filename), 'utf8');
    compiled.push({
      ...source,
      sourceFile,
      shapes: compileSourceShapes(source, sourceFile, input),
    });
  }
  return compiled;
}

export const A1B_LOW_CORRECTION_FRAME_IDS = [
  'a1b_low_corrected_s',
  'a1b_low_corrected_e',
  'a1b_low_corrected_se_corner',
  'a1b_low_corrected_transition_base',
  'a1b_low_corrected_transition_upper',
  'a1b_low_corrected_transition_composed',
] as const;
export type A1bLowCorrectionFrameId =
  (typeof A1B_LOW_CORRECTION_FRAME_IDS)[number];

export interface A1bLowCorrectionFrame {
  readonly id: A1bLowCorrectionFrameId;
  readonly kind: 'low' | 'transition-base' | 'transition-upper' | 'composed';
  readonly sourceIds: readonly A1bLowCorrectionSourceId[];
  readonly sourceFiles: readonly string[];
  readonly shapes: readonly A1aShape[];
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly bounds: { readonly x: 0; readonly y: 0; readonly w: 128; readonly h: 128 };
}

function cloneShapes(shapes: readonly A1aShape[]): A1aShape[] {
  return shapes.map((shape) => ({ ...shape }));
}

function exactSourceMap(
  sources: readonly CompiledA1bLowCorrectionSource[],
): ReadonlyMap<A1bLowCorrectionSourceId, CompiledA1bLowCorrectionSource> {
  const byId = new Map<A1bLowCorrectionSourceId, CompiledA1bLowCorrectionSource>();
  for (const source of sources) {
    if (byId.has(source.id)) {
      throw new A1bLowCorrectionImportError(`duplicate compiled source ${source.id}`);
    }
    byId.set(source.id, source);
  }
  if (byId.size !== A1B_LOW_CORRECTION_SOURCE_IDS.length) {
    throw new A1bLowCorrectionImportError(
      `compiled source inventory has ${byId.size} entries; expected 5`,
    );
  }
  for (const id of A1B_LOW_CORRECTION_SOURCE_IDS) {
    if (!byId.has(id)) throw new A1bLowCorrectionImportError(`missing compiled source ${id}`);
  }
  return byId;
}

function sourceOrThrow(
  sources: ReadonlyMap<A1bLowCorrectionSourceId, CompiledA1bLowCorrectionSource>,
  id: A1bLowCorrectionSourceId,
): CompiledA1bLowCorrectionSource {
  const source = sources.get(id);
  if (!source) throw new A1bLowCorrectionImportError(`missing compiled source ${id}`);
  return source;
}

export function buildA1bLowCorrectionFrames(
  sources: readonly CompiledA1bLowCorrectionSource[],
): readonly A1bLowCorrectionFrame[] {
  const byId = exactSourceMap(sources);
  const frame = (
    id: A1bLowCorrectionFrameId,
    kind: A1bLowCorrectionFrame['kind'],
    sourceIds: readonly A1bLowCorrectionSourceId[],
  ): A1bLowCorrectionFrame => {
    const selected = sourceIds.map((sourceId) => sourceOrThrow(byId, sourceId));
    return {
      id,
      kind,
      sourceIds,
      sourceFiles: selected.map((source) => source.sourceFile),
      shapes: selected.flatMap((source) => cloneShapes(source.shapes)),
      pivot: { x: 0.5, y: 0.5 },
      bounds: { x: 0, y: 0, w: 128, h: 128 },
    };
  };

  return [
    frame('a1b_low_corrected_s', 'low', ['low-s-straight']),
    frame('a1b_low_corrected_e', 'low', ['low-e-straight']),
    frame('a1b_low_corrected_se_corner', 'low', ['low-se-corner']),
    frame(
      'a1b_low_corrected_transition_base',
      'transition-base',
      ['transition-n-to-e-base'],
    ),
    frame(
      'a1b_low_corrected_transition_upper',
      'transition-upper',
      ['transition-n-to-e-upper'],
    ),
    frame(
      'a1b_low_corrected_transition_composed',
      'composed',
      ['transition-n-to-e-base', 'transition-n-to-e-upper'],
    ),
  ];
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function resolvePaint(value: string): string {
  if (!value.startsWith('$')) return value;
  const resolved = (A1A_PALETTE as Readonly<Record<string, string>>)[value.slice(1)];
  if (!resolved) throw new Error(`Unknown A1b low correction palette token ${value}`);
  return resolved;
}

export function a1bLowCorrectionShapeMarkup(shape: ShapeSpec): string {
  const attributes = [
    `d="${escapeAttribute(shape.d)}"`,
    `fill="${shape.fill === undefined ? 'none' : escapeAttribute(resolvePaint(shape.fill))}"`,
  ];
  if (shape.stroke !== undefined) {
    attributes.push(`stroke="${escapeAttribute(resolvePaint(shape.stroke))}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push('stroke-linecap="round" stroke-linejoin="round"');
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

export function a1bLowCorrectionFrameMarkup(
  frame: Pick<A1bLowCorrectionFrame, 'shapes'>,
): string {
  return frame.shapes.map(a1bLowCorrectionShapeMarkup).join('');
}

export function a1bLowCorrectionFrameSvg(
  frame: Pick<A1bLowCorrectionFrame, 'shapes'>,
  pixelSize = A1B_LOW_CORRECTION_CANVAS,
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1B_LOW_CORRECTION_CANVAS} ${A1B_LOW_CORRECTION_CANVAS}">` +
    a1bLowCorrectionFrameMarkup(frame) +
    '</svg>'
  );
}

export interface A1bLowCorrectionAtlasDescriptor {
  readonly version: 0;
  readonly status: 'corrective-source-proof';
  readonly contract: false;
  readonly name: 'QuotaCo A1b low-profile corrective mini-strip';
  readonly scale: number;
  readonly canvas: 128;
  readonly frameSize: number;
  readonly padding: number;
  readonly columns: 3;
  readonly rows: 2;
  readonly width: number;
  readonly height: number;
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly ruler: typeof A1B_LOW_CORRECTION_RULER;
  readonly frames: Record<A1bLowCorrectionFrameId, {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly kind: A1bLowCorrectionFrame['kind'];
    readonly sourceIds: readonly A1bLowCorrectionSourceId[];
    readonly sourceFiles: readonly string[];
    readonly bounds: A1bLowCorrectionFrame['bounds'];
  }>;
  readonly meta: {
    readonly generator: 'terrarium-a1b-low-profile-correction';
    readonly sourceCount: 5;
    readonly frameCount: 6;
    readonly rejectedControlPreserved: true;
    readonly completeBlobFamily: false;
    readonly transparentPadding: true;
    readonly temporaryFrameIds: true;
    readonly productionRegistration: false;
    readonly schemaChange: false;
    readonly directionalCastShadow: false;
    readonly note: string;
  };
}

export function a1bLowCorrectionAtlasDescriptor(
  frames: readonly A1bLowCorrectionFrame[],
  scale: number,
): A1bLowCorrectionAtlasDescriptor {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error(`Invalid A1b low correction scale ${scale}`);
  }
  if (frames.length !== A1B_LOW_CORRECTION_FRAME_IDS.length) {
    throw new Error(`A1b low correction atlas requires 6 frames; received ${frames.length}`);
  }
  const ids = frames.map((frame) => frame.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('A1b low correction atlas frame IDs must be unique');
  }
  const stride = A1B_LOW_CORRECTION_STRIDE * scale;
  const padding = A1B_LOW_CORRECTION_PADDING * scale;
  const frameSize = A1B_LOW_CORRECTION_CANVAS * scale;
  const entries = frames.map((frame, index) => [frame.id, {
    x: (index % A1B_LOW_CORRECTION_COLUMNS) * stride + padding,
    y: Math.floor(index / A1B_LOW_CORRECTION_COLUMNS) * stride + padding,
    w: frameSize,
    h: frameSize,
    kind: frame.kind,
    sourceIds: frame.sourceIds,
    sourceFiles: frame.sourceFiles,
    bounds: frame.bounds,
  }] as const);
  return {
    version: 0,
    status: 'corrective-source-proof',
    contract: false,
    name: 'QuotaCo A1b low-profile corrective mini-strip',
    scale,
    canvas: 128,
    frameSize,
    padding,
    columns: 3,
    rows: 2,
    width: A1B_LOW_CORRECTION_COLUMNS * stride,
    height: A1B_LOW_CORRECTION_ROWS * stride,
    pivot: { x: 0.5, y: 0.5 },
    ruler: A1B_LOW_CORRECTION_RULER,
    frames: Object.fromEntries(entries) as A1bLowCorrectionAtlasDescriptor['frames'],
    meta: {
      generator: 'terrarium-a1b-low-profile-correction',
      sourceCount: 5,
      frameCount: 6,
      rejectedControlPreserved: true,
      completeBlobFamily: false,
      transparentPadding: true,
      temporaryFrameIds: true,
      productionRegistration: false,
      schemaChange: false,
      directionalCastShadow: false,
      note: 'Corrective mini-strip only. Approve the finished low-wall silhouette before propagating it through the existing 47-blob topology.',
    },
  };
}

export function a1bLowCorrectionAtlasSvg(
  frames: readonly A1bLowCorrectionFrame[],
  scale: number,
): string {
  const atlas = a1bLowCorrectionAtlasDescriptor(frames, scale);
  const cells = frames.map((frame) => {
    const rect = atlas.frames[frame.id];
    return (
      `<svg x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" ` +
      `viewBox="0 0 ${A1B_LOW_CORRECTION_CANVAS} ${A1B_LOW_CORRECTION_CANVAS}">` +
      a1bLowCorrectionFrameMarkup(frame) +
      '</svg>'
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" ` +
    `viewBox="0 0 ${atlas.width} ${atlas.height}">${cells}</svg>`
  );
}

export interface A1bLowCorrectionFamily {
  readonly sources: readonly CompiledA1bLowCorrectionSource[];
  readonly frames: readonly A1bLowCorrectionFrame[];
}

export async function loadA1bLowCorrectionFamily(
  options: CompileA1bLowCorrectionOptions,
): Promise<A1bLowCorrectionFamily> {
  const sources = await compileA1bLowCorrectionDirectory(options);
  return { sources, frames: buildA1bLowCorrectionFrames(sources) };
}
