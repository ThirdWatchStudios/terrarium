import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  blobIndex,
  configForIndex,
  type CornerState,
  type WallTileConfig,
} from '../../src/tiles/blob';
import { compileAuthoredSvg } from '../parts/importer';
import {
  A1A_PALETTE,
  type A1aLayer,
  type A1aShape,
} from './a1aProof';

/**
 * Proof-only A1b topology compiler for the approved split-B wall construction.
 *
 * This module intentionally lives under scripts. It reuses the canonical
 * 47-blob table, compiles editable SVG pieces, and emits temporary review
 * evidence. It does not register templates, alter exports, or define a schema.
 */

export const A1B_TOPOLOGY_CANVAS = 128;
export const A1B_TOPOLOGY_TILE_COUNT = BLOB_TILE_COUNT;
export const A1B_TOPOLOGY_COMPONENT_COUNT = BLOB_TILE_COUNT * 2 + 7;
export const A1B_TOPOLOGY_EVIDENCE_COUNT = BLOB_TILE_COUNT * 2 + 5;
export const A1B_TOPOLOGY_ATLAS_COLUMNS = 11;
export const A1B_TOPOLOGY_ATLAS_ROWS = 9;
export const A1B_TOPOLOGY_ATLAS_PADDING = 8;
export const A1B_TOPOLOGY_CELL_STRIDE =
  A1B_TOPOLOGY_CANVAS + A1B_TOPOLOGY_ATLAS_PADDING * 2;

export const A1B_TOPOLOGY_BANKS = ['base', 'upper'] as const;
export type A1bTopologyBank = (typeof A1B_TOPOLOGY_BANKS)[number];

export const A1B_TOPOLOGY_ROLE_IDS = [
  'edge-n',
  'edge-e',
  'edge-s',
  'edge-w',
  'convex-ne',
  'convex-se',
  'convex-sw',
  'convex-nw',
  'concave-ne',
  'concave-se',
  'concave-sw',
  'concave-nw',
  'one-ne-n',
  'one-ne-e',
  'one-se-s',
  'one-se-e',
  'one-sw-s',
  'one-sw-w',
  'one-nw-n',
  'one-nw-w',
] as const;
export type A1bTopologyRoleId = (typeof A1B_TOPOLOGY_ROLE_IDS)[number];

export const A1B_TOPOLOGY_STATE_IDS = [
  'profile-n-to-e-upper',
  'profile-w-to-s-upper',
  'door-base',
  'door-upper-frame',
  'door-leaf-closed',
  'door-leaf-open',
  'window-wide-upper',
] as const;
export type A1bTopologyStateId = (typeof A1B_TOPOLOGY_STATE_IDS)[number];

export type A1bTopologyProfileCase =
  | 'low'
  | 'full-topology'
  | 'full-n'
  | 'full-w'
  | 'full-nw'
  | 'transition-n-to-e'
  | 'transition-w-to-s'
  | 'door-closed-n'
  | 'door-open-n'
  | 'window-wide-n';

export type A1bTopologySourceId =
  | `${A1bTopologyBank}/${A1bTopologyRoleId}`
  | `state/${A1bTopologyStateId}`;

export interface A1bTopologySourceSpec {
  readonly id: A1bTopologySourceId;
  readonly kind: 'topology' | 'state';
  readonly bank: A1bTopologyBank | 'state';
  readonly roleId?: A1bTopologyRoleId;
  readonly stateId?: A1bTopologyStateId;
  readonly layer: A1aLayer;
  readonly semanticGroup: 'detail/base' | 'detail/upper' | 'detail/state';
  readonly relativePath: string;
}

export interface CompiledA1bTopologySource extends A1bTopologySourceSpec {
  readonly sourceFile: string;
  readonly shapes: readonly A1aShape[];
}

export interface CompileA1bTopologyDirectoryOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

const STATE_LAYERS: Readonly<Record<A1bTopologyStateId, A1aLayer>> = {
  'profile-n-to-e-upper': 'upper',
  'profile-w-to-s-upper': 'upper',
  'door-base': 'base',
  'door-upper-frame': 'upper',
  'door-leaf-closed': 'opening',
  'door-leaf-open': 'opening',
  'window-wide-upper': 'opening',
};

function topologySourceSpec(
  bank: A1bTopologyBank,
  roleId: A1bTopologyRoleId,
): A1bTopologySourceSpec {
  return {
    id: `${bank}/${roleId}`,
    kind: 'topology',
    bank,
    roleId,
    layer: bank,
    semanticGroup: `detail/${bank}`,
    relativePath: `${bank}/${roleId}.svg`,
  };
}

function stateSourceSpec(stateId: A1bTopologyStateId): A1bTopologySourceSpec {
  return {
    id: `state/${stateId}`,
    kind: 'state',
    bank: 'state',
    stateId,
    layer: STATE_LAYERS[stateId],
    semanticGroup: 'detail/state',
    relativePath: `state/${stateId}.svg`,
  };
}

/** Exact 47-file editable SVG inventory: 20 base, 20 upper, 7 state. */
export const A1B_TOPOLOGY_SOURCE_INVENTORY: readonly A1bTopologySourceSpec[] = [
  ...A1B_TOPOLOGY_BANKS.flatMap((bank) =>
    A1B_TOPOLOGY_ROLE_IDS.map((roleId) => topologySourceSpec(bank, roleId))),
  ...A1B_TOPOLOGY_STATE_IDS.map(stateSourceSpec),
];

export const A1B_TOPOLOGY_SOURCE_IDS: readonly A1bTopologySourceId[] =
  A1B_TOPOLOGY_SOURCE_INVENTORY.map((source) => source.id);

export class A1bTopologyImportError extends Error {
  constructor(message: string) {
    super(`A1b topology import: ${message}`);
    this.name = 'A1bTopologyImportError';
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function repositoryPrefix(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
  if (
    !normalized ||
    path.posix.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    throw new A1bTopologyImportError('sourcePathPrefix must be repository-relative');
  }
  return normalized;
}

const TOKEN_PAINTS = new Map<string, string>([
  [A1A_PALETTE.cream, '$cream'],
  [A1A_PALETTE.green, '$green'],
  [A1A_PALETTE.teal, '$teal'],
]);

const LITERAL_PAINTS = new Set<string>([
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
  throw new A1bTopologyImportError(
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
    throw new A1bTopologyImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix recolorable and literal paint`,
    );
  }
  if (fillToken && strokeToken && fillToken !== strokeToken) {
    throw new A1bTopologyImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix palette tokens ${fillToken} and ${strokeToken}`,
    );
  }
}

function compileSourceShapes(
  source: A1bTopologySourceSpec,
  sourceFile: string,
  input: string,
): A1aShape[] {
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(input)) {
    throw new A1bTopologyImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }
  const compiled = compileAuthoredSvg(input, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  const shapes = compiled.map((entry, shapeIndex): A1aShape => {
    if (entry.silhouette !== false) {
      throw new A1bTopologyImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must live under ${source.semanticGroup} art`,
      );
    }
    const fill = remapPaint(sourceFile, shapeIndex, 'fill', entry.fill);
    const stroke = remapPaint(sourceFile, shapeIndex, 'stroke', entry.stroke);
    validatePaintPurity(sourceFile, shapeIndex, fill, stroke);
    return {
      ...entry,
      layer: source.layer,
      ...(fill === undefined ? {} : { fill }),
      ...(stroke === undefined ? {} : { stroke }),
    };
  });
  if (!shapes.some((shape) => paletteToken(shape.fill) || paletteToken(shape.stroke))) {
    throw new A1bTopologyImportError(
      `${sourceFile} must contain at least one cream, green, or teal product field`,
    );
  }
  return shapes;
}

async function validateSourceTree(inputDir: string): Promise<void> {
  const rootEntries = (await readdir(inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expectedDirectories = new Set(['base', 'upper', 'state']);
  for (const entry of rootEntries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isDirectory() || !expectedDirectories.has(entry.name)) {
      throw new A1bTopologyImportError(`unexpected source ${entry.name}`);
    }
    expectedDirectories.delete(entry.name);
  }
  for (const missing of expectedDirectories) {
    throw new A1bTopologyImportError(`missing source directory ${missing}`);
  }

  for (const directory of ['base', 'upper', 'state'] as const) {
    const expectedFiles = new Set(
      A1B_TOPOLOGY_SOURCE_INVENTORY
        .filter((source) => source.bank === directory)
        .map((source) => path.posix.basename(source.relativePath)),
    );
    const entries = (await readdir(path.join(inputDir, directory), { withFileTypes: true }))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      if (!entry.isFile() || !expectedFiles.delete(entry.name)) {
        throw new A1bTopologyImportError(`unexpected source ${directory}/${entry.name}`);
      }
    }
    for (const missing of expectedFiles) {
      throw new A1bTopologyImportError(`missing source ${directory}/${missing}`);
    }
  }
}

/** Compile the exact 47-source proof inventory atomically in stable order. */
export async function compileA1bTopologyDirectory(
  options: CompileA1bTopologyDirectoryOptions,
): Promise<CompiledA1bTopologySource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  await validateSourceTree(options.inputDir);
  const compiled: CompiledA1bTopologySource[] = [];
  for (const source of A1B_TOPOLOGY_SOURCE_INVENTORY) {
    const sourceFile = `${prefix}/${source.relativePath}`;
    const input = await readFile(path.join(options.inputDir, source.relativePath), 'utf8');
    compiled.push({
      ...source,
      sourceFile,
      shapes: compileSourceShapes(source, sourceFile, input),
    });
  }
  return compiled;
}

type Edge = 'n' | 'e' | 's' | 'w';
type Corner = 'ne' | 'se' | 'sw' | 'nw';

const CORNERS: readonly {
  readonly corner: Corner;
  readonly first: Edge;
  readonly second: Edge;
}[] = [
  { corner: 'ne', first: 'n', second: 'e' },
  { corner: 'se', first: 's', second: 'e' },
  { corner: 'sw', first: 's', second: 'w' },
  { corner: 'nw', first: 'n', second: 'w' },
];

function assertBlobIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= BLOB_TILE_COUNT) {
    throw new Error(`A1b topology blob index must be 0..46; received ${index}`);
  }
}

/** The exact authored-piece truth table for one canonical 47-blob index. */
export function a1bTopologyRoleIdsForIndex(index: number): readonly A1bTopologyRoleId[] {
  assertBlobIndex(index);
  const config = configForIndex(index);
  const exposed: Readonly<Record<Edge, boolean>> = {
    n: !config.n,
    e: !config.e,
    s: !config.s,
    w: !config.w,
  };
  const corners: Readonly<Record<Corner, CornerState>> = {
    ne: config.ne,
    se: config.se,
    sw: config.sw,
    nw: config.nw,
  };
  const selected = new Set<A1bTopologyRoleId>();
  for (const edge of ['n', 'e', 's', 'w'] as const) {
    if (exposed[edge]) selected.add(`edge-${edge}`);
  }
  for (const spec of CORNERS) {
    const firstExposed = exposed[spec.first];
    const secondExposed = exposed[spec.second];
    if (firstExposed && secondExposed) {
      selected.add(`convex-${spec.corner}`);
    } else if (!firstExposed && !secondExposed) {
      if (corners[spec.corner] === 'concave') selected.add(`concave-${spec.corner}`);
    } else {
      const exposedEdge = firstExposed ? spec.first : spec.second;
      selected.add(`one-${spec.corner}-${exposedEdge}` as A1bTopologyRoleId);
    }
  }
  return A1B_TOPOLOGY_ROLE_IDS.filter((roleId) => selected.has(roleId));
}

export interface A1bTopologyMaskResolution {
  readonly rawNeighbors: number;
  readonly blobIndex: number;
  readonly canonicalMask: number;
  readonly config: WallTileConfig;
  readonly roleIds: readonly A1bTopologyRoleId[];
  readonly baseComponentId: A1bTopologyComponentFrameId;
  readonly upperComponentId: A1bTopologyComponentFrameId;
}

export type A1bTopologyLayerProfile = 'low' | 'full';

export interface A1bTopologyEvidenceResolution extends A1bTopologyMaskResolution {
  readonly requestedProfile: A1bTopologyLayerProfile;
  readonly evidenceFrameId:
    | `a1b_evidence_low_${string}`
    | `a1b_evidence_full_${string}`;
}

/** Resolve any raw 8-neighbor mask through the shared canonical table. */
export function resolveA1bTopologyMask(rawNeighbors: number): A1bTopologyMaskResolution {
  if (!Number.isInteger(rawNeighbors) || rawNeighbors < 0 || rawNeighbors > 0xff) {
    throw new Error(`A1b topology raw neighbors must be 0..255; received ${rawNeighbors}`);
  }
  const index = blobIndex(rawNeighbors);
  return {
    rawNeighbors,
    blobIndex: index,
    canonicalMask: BLOB_CONFIGS[index],
    config: configForIndex(index),
    roleIds: a1bTopologyRoleIdsForIndex(index),
    baseComponentId: `a1b_component_base_${padBlobIndex(index)}`,
    upperComponentId: `a1b_component_upper_${padBlobIndex(index)}`,
  };
}

/**
 * Resolve a raw mask to the explicitly requested low/full proof frame.
 * Profile is an input; it is never inferred from connectivity.
 */
export function resolveA1bTopologyEvidence(
  rawNeighbors: number,
  requestedProfile: A1bTopologyLayerProfile,
): A1bTopologyEvidenceResolution {
  const resolution = resolveA1bTopologyMask(rawNeighbors);
  return {
    ...resolution,
    requestedProfile,
    evidenceFrameId: `a1b_evidence_${requestedProfile}_${padBlobIndex(resolution.blobIndex)}`,
  };
}

export interface A1bTopologyKernelSpec {
  readonly outerStart: number;
  readonly innerStart: number;
  readonly firstCut: number;
  readonly secondCut: number;
  readonly innerEnd: number;
  readonly outerEnd: number;
  readonly material: '$green' | '$cream';
}

/** Approved B ruler plus the authored socket ownership cuts. */
export const A1B_TOPOLOGY_KERNELS: Readonly<Record<A1bTopologyBank, A1bTopologyKernelSpec>> = {
  base: {
    outerStart: 94,
    innerStart: 96,
    firstCut: 102,
    secondCut: 112,
    innerEnd: 118,
    outerEnd: 120,
    material: '$green',
  },
  upper: {
    outerStart: 56,
    innerStart: 58,
    firstCut: 68,
    secondCut: 87,
    innerEnd: 97,
    outerEnd: 99,
    material: '$cream',
  },
};

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function rectPath(rect: Rect): string {
  return `M ${rect.x} ${rect.y} H ${rect.x + rect.w} V ${rect.y + rect.h} H ${rect.x} Z`;
}

function compoundRectPath(rects: readonly Rect[]): string {
  return rects.map(rectPath).join(' ');
}

function clippedInnerCorner(
  corner: Corner,
  spec: A1bTopologyKernelSpec,
): Rect {
  const west = corner === 'nw' || corner === 'sw';
  const north = corner === 'nw' || corner === 'ne';
  const x0 = west ? spec.innerStart : spec.secondCut;
  const x1 = west ? spec.firstCut : spec.innerEnd;
  const y0 = north ? spec.innerStart : spec.secondCut;
  const y1 = north ? spec.firstCut : spec.innerEnd;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function outerCorner(corner: Corner, spec: A1bTopologyKernelSpec): Rect {
  const west = corner === 'nw' || corner === 'sw';
  const north = corner === 'nw' || corner === 'ne';
  const x0 = west ? spec.outerStart : spec.secondCut;
  const x1 = west ? spec.firstCut : spec.outerEnd;
  const y0 = north ? spec.outerStart : spec.secondCut;
  const y1 = north ? spec.firstCut : spec.outerEnd;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function connectedArmRects(
  edge: Edge,
  spec: A1bTopologyKernelSpec,
): { readonly outer: readonly Rect[]; readonly inner: readonly Rect[] } {
  const span = spec.outerEnd - spec.outerStart;
  const innerSpan = spec.innerEnd - spec.innerStart;
  const centerSpan = spec.secondCut - spec.firstCut;
  switch (edge) {
    case 'n':
      return {
        outer: [
          { x: spec.outerStart, y: 0, w: span, h: spec.outerStart },
          { x: spec.firstCut, y: spec.outerStart, w: centerSpan, h: spec.firstCut - spec.outerStart },
        ],
        inner: [
          { x: spec.innerStart, y: 0, w: innerSpan, h: spec.innerStart },
          { x: spec.firstCut, y: spec.innerStart, w: centerSpan, h: spec.firstCut - spec.innerStart },
        ],
      };
    case 'e':
      return {
        outer: [
          { x: spec.outerEnd, y: spec.outerStart, w: A1B_TOPOLOGY_CANVAS - spec.outerEnd, h: span },
          { x: spec.secondCut, y: spec.firstCut, w: spec.outerEnd - spec.secondCut, h: centerSpan },
        ],
        inner: [
          { x: spec.innerEnd, y: spec.innerStart, w: A1B_TOPOLOGY_CANVAS - spec.innerEnd, h: innerSpan },
          { x: spec.secondCut, y: spec.firstCut, w: spec.innerEnd - spec.secondCut, h: centerSpan },
        ],
      };
    case 's':
      return {
        outer: [
          { x: spec.outerStart, y: spec.outerEnd, w: span, h: A1B_TOPOLOGY_CANVAS - spec.outerEnd },
          { x: spec.firstCut, y: spec.secondCut, w: centerSpan, h: spec.outerEnd - spec.secondCut },
        ],
        inner: [
          { x: spec.innerStart, y: spec.innerEnd, w: innerSpan, h: A1B_TOPOLOGY_CANVAS - spec.innerEnd },
          { x: spec.firstCut, y: spec.secondCut, w: centerSpan, h: spec.innerEnd - spec.secondCut },
        ],
      };
    case 'w':
      return {
        outer: [
          { x: 0, y: spec.outerStart, w: spec.outerStart, h: span },
          { x: spec.outerStart, y: spec.firstCut, w: spec.firstCut - spec.outerStart, h: centerSpan },
        ],
        inner: [
          { x: 0, y: spec.innerStart, w: spec.innerStart, h: innerSpan },
          { x: spec.innerStart, y: spec.firstCut, w: spec.firstCut - spec.innerStart, h: centerSpan },
        ],
      };
  }
}

/**
 * Structural arm/core fill beneath authored faces and sockets.
 *
 * Convex, concave, and one-sided socket quadrants are deliberately absent;
 * their SVG roles own the complete molded silhouette, so a square kernel can
 * never leak beneath an authored radius. Only invisible center, connected
 * arms, and fully-solid diagonal sockets are structural.
 */
export function a1bTopologyKernelShapesForIndex(
  index: number,
  bank: A1bTopologyBank,
): readonly A1aShape[] {
  assertBlobIndex(index);
  const config = configForIndex(index);
  const spec = A1B_TOPOLOGY_KERNELS[bank];
  const outerRects: Rect[] = [{
    x: spec.firstCut,
    y: spec.firstCut,
    w: spec.secondCut - spec.firstCut,
    h: spec.secondCut - spec.firstCut,
  }];
  const innerRects: Rect[] = [{ ...outerRects[0] }];

  for (const edge of ['n', 'e', 's', 'w'] as const) {
    if (!config[edge]) continue;
    const arm = connectedArmRects(edge, spec);
    outerRects.push(...arm.outer);
    innerRects.push(...arm.inner);
  }
  for (const corner of ['ne', 'se', 'sw', 'nw'] as const) {
    if (config[corner] !== 'solid') continue;
    outerRects.push(outerCorner(corner, spec));
    innerRects.push(clippedInnerCorner(corner, spec));
  }

  return [
    {
      layer: bank,
      d: compoundRectPath(outerRects),
      fill: A1A_PALETTE.charcoal,
      silhouette: false,
    },
    {
      layer: bank,
      d: compoundRectPath(innerRects),
      fill: spec.material,
      silhouette: false,
    },
  ];
}

export type A1bTopologyComponentFrameId =
  | `a1b_component_base_${string}`
  | `a1b_component_upper_${string}`
  | `a1b_component_state_${A1bTopologyStateId}`;

export interface A1bTopologyBounds {
  readonly x: 0;
  readonly y: 0;
  readonly w: 128;
  readonly h: 128;
}

export interface A1bTopologyComponentFrame {
  readonly id: A1bTopologyComponentFrameId;
  readonly kind: 'topology' | 'state';
  readonly bank: A1bTopologyBank | 'state';
  readonly blobIndex?: number;
  readonly canonicalMask?: number;
  readonly roleIds: readonly A1bTopologyRoleId[];
  readonly stateId?: A1bTopologyStateId;
  readonly sourceIds: readonly A1bTopologySourceId[];
  readonly sourceFiles: readonly string[];
  readonly shapes: readonly A1aShape[];
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly bounds: A1bTopologyBounds;
}

function padBlobIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

function cloneShapes(shapes: readonly A1aShape[]): A1aShape[] {
  return shapes.map((shape) => ({ ...shape }));
}

function exactCompiledSourceMap(
  sources: readonly CompiledA1bTopologySource[],
): ReadonlyMap<A1bTopologySourceId, CompiledA1bTopologySource> {
  const byId = new Map<A1bTopologySourceId, CompiledA1bTopologySource>();
  for (const source of sources) {
    if (byId.has(source.id)) throw new A1bTopologyImportError(`duplicate compiled source ${source.id}`);
    byId.set(source.id, source);
  }
  if (byId.size !== A1B_TOPOLOGY_SOURCE_INVENTORY.length) {
    throw new A1bTopologyImportError(
      `compiled source inventory has ${byId.size} entries; expected ${A1B_TOPOLOGY_SOURCE_INVENTORY.length}`,
    );
  }
  for (const id of A1B_TOPOLOGY_SOURCE_IDS) {
    if (!byId.has(id)) throw new A1bTopologyImportError(`missing compiled source ${id}`);
  }
  return byId;
}

function sourceOrThrow(
  sources: ReadonlyMap<A1bTopologySourceId, CompiledA1bTopologySource>,
  id: A1bTopologySourceId,
): CompiledA1bTopologySource {
  const source = sources.get(id);
  if (!source) throw new A1bTopologyImportError(`missing compiled source ${id}`);
  return source;
}

/** Build 47 base components, 47 upper components, then 7 state components. */
export function buildA1bTopologyComponentFrames(
  sources: readonly CompiledA1bTopologySource[],
): readonly A1bTopologyComponentFrame[] {
  const byId = exactCompiledSourceMap(sources);
  const frames: A1bTopologyComponentFrame[] = [];
  for (const bank of A1B_TOPOLOGY_BANKS) {
    for (let blobIndex = 0; blobIndex < BLOB_TILE_COUNT; blobIndex += 1) {
      const roleIds = a1bTopologyRoleIdsForIndex(blobIndex);
      const selectedSources = roleIds.map((roleId) =>
        sourceOrThrow(byId, `${bank}/${roleId}`));
      frames.push({
        id: `a1b_component_${bank}_${padBlobIndex(blobIndex)}`,
        kind: 'topology',
        bank,
        blobIndex,
        canonicalMask: BLOB_CONFIGS[blobIndex],
        roleIds,
        sourceIds: selectedSources.map((source) => source.id),
        sourceFiles: selectedSources.map((source) => source.sourceFile),
        shapes: [
          ...cloneShapes(a1bTopologyKernelShapesForIndex(blobIndex, bank)),
          ...selectedSources.flatMap((source) => cloneShapes(source.shapes)),
        ],
        pivot: { x: 0.5, y: 0.5 },
        bounds: { x: 0, y: 0, w: 128, h: 128 },
      });
    }
  }
  for (const stateId of A1B_TOPOLOGY_STATE_IDS) {
    const source = sourceOrThrow(byId, `state/${stateId}`);
    frames.push({
      id: `a1b_component_state_${stateId}`,
      kind: 'state',
      bank: 'state',
      roleIds: [],
      stateId,
      sourceIds: [source.id],
      sourceFiles: [source.sourceFile],
      shapes: cloneShapes(source.shapes),
      pivot: { x: 0.5, y: 0.5 },
      bounds: { x: 0, y: 0, w: 128, h: 128 },
    });
  }
  if (frames.length !== A1B_TOPOLOGY_COMPONENT_COUNT) {
    throw new Error(
      `A1b topology component builder emitted ${frames.length}; expected ${A1B_TOPOLOGY_COMPONENT_COUNT}`,
    );
  }
  return frames;
}

export const A1B_TOPOLOGY_STATE_COMPATIBILITY: Readonly<Record<
  A1bTopologyStateId,
  {
    readonly compatibleBlobIndex: 3 | 10 | 12;
    readonly profileCases: readonly A1bTopologyProfileCase[];
  }
>> = {
  'profile-n-to-e-upper': {
    compatibleBlobIndex: 12,
    profileCases: ['transition-n-to-e'],
  },
  'profile-w-to-s-upper': {
    compatibleBlobIndex: 3,
    profileCases: ['transition-w-to-s'],
  },
  'door-base': {
    compatibleBlobIndex: 10,
    profileCases: ['door-closed-n', 'door-open-n'],
  },
  'door-upper-frame': {
    compatibleBlobIndex: 10,
    profileCases: ['door-closed-n', 'door-open-n'],
  },
  'door-leaf-closed': {
    compatibleBlobIndex: 10,
    profileCases: ['door-closed-n'],
  },
  'door-leaf-open': {
    compatibleBlobIndex: 10,
    profileCases: ['door-open-n'],
  },
  'window-wide-upper': {
    compatibleBlobIndex: 10,
    profileCases: ['window-wide-n'],
  },
};

export type A1bTopologyEvidenceFrameId =
  | `a1b_evidence_low_${string}`
  | `a1b_evidence_full_${string}`
  | 'a1b_evidence_transition_n_to_e'
  | 'a1b_evidence_transition_w_to_s'
  | 'a1b_evidence_door_closed_n'
  | 'a1b_evidence_door_open_n'
  | 'a1b_evidence_window_wide_n';

export interface A1bTopologyEvidenceFrame {
  readonly id: A1bTopologyEvidenceFrameId;
  readonly profileCase: A1bTopologyProfileCase;
  readonly blobIndex: number;
  readonly canonicalMask: number;
  readonly baseBlobIndex: number;
  readonly upperBlobIndex?: number;
  readonly stateIds: readonly A1bTopologyStateId[];
  readonly componentIds: readonly A1bTopologyComponentFrameId[];
  readonly sourceIds: readonly A1bTopologySourceId[];
  readonly sourceFiles: readonly string[];
  readonly shapes: readonly A1aShape[];
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly bounds: A1bTopologyBounds;
}

function exactComponentMap(
  components: readonly A1bTopologyComponentFrame[],
): ReadonlyMap<A1bTopologyComponentFrameId, A1bTopologyComponentFrame> {
  if (components.length !== A1B_TOPOLOGY_COMPONENT_COUNT) {
    throw new Error(
      `A1b topology evidence requires ${A1B_TOPOLOGY_COMPONENT_COUNT} components; received ${components.length}`,
    );
  }
  const byId = new Map<A1bTopologyComponentFrameId, A1bTopologyComponentFrame>();
  for (const component of components) {
    if (byId.has(component.id)) throw new Error(`Duplicate A1b topology component ${component.id}`);
    byId.set(component.id, component);
  }
  return byId;
}

function componentOrThrow(
  components: ReadonlyMap<A1bTopologyComponentFrameId, A1bTopologyComponentFrame>,
  id: A1bTopologyComponentFrameId,
): A1bTopologyComponentFrame {
  const component = components.get(id);
  if (!component) throw new Error(`Missing A1b topology component ${id}`);
  return component;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function evidenceFrame(
  id: A1bTopologyEvidenceFrameId,
  profileCase: A1bTopologyProfileCase,
  blobIndex: number,
  parts: readonly A1bTopologyComponentFrame[],
  upperBlobIndex?: number,
): A1bTopologyEvidenceFrame {
  assertBlobIndex(blobIndex);
  const stateIds = parts.flatMap((part) => part.stateId === undefined ? [] : [part.stateId]);
  return {
    id,
    profileCase,
    blobIndex,
    canonicalMask: BLOB_CONFIGS[blobIndex],
    baseBlobIndex: blobIndex,
    ...(upperBlobIndex === undefined ? {} : { upperBlobIndex }),
    stateIds,
    componentIds: parts.map((part) => part.id),
    sourceIds: unique(parts.flatMap((part) => part.sourceIds)),
    sourceFiles: unique(parts.flatMap((part) => part.sourceFiles)),
    shapes: parts.flatMap((part) => cloneShapes(part.shapes)),
    pivot: { x: 0.5, y: 0.5 },
    bounds: { x: 0, y: 0, w: 128, h: 128 },
  };
}

function representativeFullProfileCase(index: number): A1bTopologyProfileCase {
  // Review labels only. They do not select a frame or infer a runtime profile.
  if (index === 10) return 'full-n';
  if (index === 5) return 'full-w';
  if (index === 6) return 'full-nw';
  return 'full-topology';
}

/**
 * Build the deterministic 99-frame acceptance sheet:
 * 47 low, 47 full, 2 mixed-profile transitions, and 3 opening states.
 */
export function buildA1bTopologyEvidenceFrames(
  components: readonly A1bTopologyComponentFrame[],
): readonly A1bTopologyEvidenceFrame[] {
  const byId = exactComponentMap(components);
  const base = (index: number): A1bTopologyComponentFrame =>
    componentOrThrow(byId, `a1b_component_base_${padBlobIndex(index)}`);
  const upper = (index: number): A1bTopologyComponentFrame =>
    componentOrThrow(byId, `a1b_component_upper_${padBlobIndex(index)}`);
  const state = (id: A1bTopologyStateId): A1bTopologyComponentFrame =>
    componentOrThrow(byId, `a1b_component_state_${id}`);

  const frames: A1bTopologyEvidenceFrame[] = [];
  for (let blobIndex = 0; blobIndex < BLOB_TILE_COUNT; blobIndex += 1) {
    frames.push(evidenceFrame(
      `a1b_evidence_low_${padBlobIndex(blobIndex)}`,
      'low',
      blobIndex,
      [base(blobIndex)],
    ));
  }
  for (let blobIndex = 0; blobIndex < BLOB_TILE_COUNT; blobIndex += 1) {
    frames.push(evidenceFrame(
      `a1b_evidence_full_${padBlobIndex(blobIndex)}`,
      representativeFullProfileCase(blobIndex),
      blobIndex,
      [base(blobIndex), upper(blobIndex)],
      blobIndex,
    ));
  }
  frames.push(
    evidenceFrame(
      'a1b_evidence_transition_n_to_e',
      'transition-n-to-e',
      12,
      [base(12), state('profile-n-to-e-upper')],
    ),
    evidenceFrame(
      'a1b_evidence_transition_w_to_s',
      'transition-w-to-s',
      3,
      [base(3), state('profile-w-to-s-upper')],
    ),
    evidenceFrame(
      'a1b_evidence_door_closed_n',
      'door-closed-n',
      10,
      [state('door-base'), state('door-upper-frame'), state('door-leaf-closed')],
    ),
    evidenceFrame(
      'a1b_evidence_door_open_n',
      'door-open-n',
      10,
      [state('door-base'), state('door-upper-frame'), state('door-leaf-open')],
    ),
    evidenceFrame(
      'a1b_evidence_window_wide_n',
      'window-wide-n',
      10,
      [base(10), state('window-wide-upper')],
    ),
  );
  if (frames.length !== A1B_TOPOLOGY_EVIDENCE_COUNT) {
    throw new Error(
      `A1b topology evidence builder emitted ${frames.length}; expected ${A1B_TOPOLOGY_EVIDENCE_COUNT}`,
    );
  }
  const ids = frames.map((frame) => frame.id);
  if (new Set(ids).size !== ids.length) throw new Error('A1b topology evidence IDs must be unique');
  return frames;
}

export interface A1bTopologyComponentManifest {
  readonly version: 0;
  readonly status: 'proof-only';
  readonly contract: false;
  readonly name: 'QuotaCo high-oblique A1b topology components';
  readonly canvas: 128;
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly components: Record<string, {
    readonly kind: 'topology' | 'state';
    readonly bank: A1bTopologyBank | 'state';
    readonly blobIndex?: number;
    readonly canonicalMask?: number;
    readonly roleIds: readonly A1bTopologyRoleId[];
    readonly stateId?: A1bTopologyStateId;
    readonly compatibleBlobIndex?: number;
    readonly profileCases?: readonly A1bTopologyProfileCase[];
    readonly sourceIds: readonly A1bTopologySourceId[];
    readonly sourceFiles: readonly string[];
    readonly bounds: A1bTopologyBounds;
  }>;
  readonly meta: {
    readonly generator: 'terrarium-a1b-topology-proof';
    readonly sourceCount: 47;
    readonly componentCount: 101;
    readonly baseCount: 47;
    readonly upperCount: 47;
    readonly stateCount: 7;
    readonly temporaryFrameIds: true;
    readonly productionRegistration: false;
    readonly schemaChange: false;
    readonly profileMetadataPermanent: false;
  };
}

/** Temporary component manifest; deliberately not an export contract. */
export function a1bTopologyComponentManifest(
  components: readonly A1bTopologyComponentFrame[],
): A1bTopologyComponentManifest {
  exactComponentMap(components);
  const entries = components.map((component) => {
    const compatibility = component.stateId === undefined
      ? undefined
      : A1B_TOPOLOGY_STATE_COMPATIBILITY[component.stateId];
    return [component.id, {
      kind: component.kind,
      bank: component.bank,
      ...(component.blobIndex === undefined ? {} : { blobIndex: component.blobIndex }),
      ...(component.canonicalMask === undefined ? {} : { canonicalMask: component.canonicalMask }),
      roleIds: component.roleIds,
      ...(component.stateId === undefined ? {} : { stateId: component.stateId }),
      ...(compatibility === undefined ? {} : {
        compatibleBlobIndex: compatibility.compatibleBlobIndex,
        profileCases: compatibility.profileCases,
      }),
      sourceIds: component.sourceIds,
      sourceFiles: component.sourceFiles,
      bounds: component.bounds,
    }] as const;
  });
  return {
    version: 0,
    status: 'proof-only',
    contract: false,
    name: 'QuotaCo high-oblique A1b topology components',
    canvas: 128,
    pivot: { x: 0.5, y: 0.5 },
    components: Object.fromEntries(entries),
    meta: {
      generator: 'terrarium-a1b-topology-proof',
      sourceCount: 47,
      componentCount: 101,
      baseCount: 47,
      upperCount: 47,
      stateCount: 7,
      temporaryFrameIds: true,
      productionRegistration: false,
      schemaChange: false,
      profileMetadataPermanent: false,
    },
  };
}

export interface A1bTopologyAtlasRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface A1bTopologyAtlasDescriptor {
  readonly version: 0;
  readonly status: 'proof-only';
  readonly contract: false;
  readonly name: 'QuotaCo high-oblique A1b complete topology proof';
  readonly scale: number;
  readonly canvas: 128;
  readonly frameSize: number;
  readonly padding: number;
  readonly columns: 11;
  readonly rows: 9;
  readonly width: number;
  readonly height: number;
  readonly pivot: { readonly x: 0.5; readonly y: 0.5 };
  readonly frames: Record<string, A1bTopologyAtlasRect & {
    readonly profileCase: A1bTopologyProfileCase;
    readonly blobIndex: number;
    readonly canonicalMask: number;
    readonly baseBlobIndex: number;
    readonly upperBlobIndex?: number;
    readonly stateIds: readonly A1bTopologyStateId[];
    readonly componentIds: readonly A1bTopologyComponentFrameId[];
    readonly sourceIds: readonly A1bTopologySourceId[];
    readonly sourceFiles: readonly string[];
    readonly bounds: A1bTopologyBounds;
  }>;
  readonly meta: {
    readonly generator: 'terrarium-a1b-topology-proof';
    readonly evidenceCount: 99;
    readonly lowCount: 47;
    readonly fullCount: 47;
    readonly transitionCount: 2;
    readonly openingCount: 3;
    readonly completeBlobFamily: true;
    readonly transparentPadding: true;
    readonly temporaryFrameIds: true;
    readonly productionRegistration: false;
    readonly schemaChange: false;
    readonly directionalCastShadow: false;
    readonly note: string;
  };
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
  const palette = A1A_PALETTE as Readonly<Record<string, string>>;
  const resolved = palette[value.slice(1)];
  if (!resolved) throw new Error(`Unknown A1b topology palette token ${value}`);
  return resolved;
}

export function a1bTopologyShapeMarkup(shape: ShapeSpec): string {
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

export function a1bTopologyFrameMarkup(frame: A1bTopologyEvidenceFrame): string {
  return frame.shapes.map(a1bTopologyShapeMarkup).join('');
}

export function a1bTopologyFrameSvg(
  frame: A1bTopologyEvidenceFrame,
  pixelSize = A1B_TOPOLOGY_CANVAS,
): string {
  if (!Number.isFinite(pixelSize) || pixelSize <= 0) {
    throw new Error(`Invalid A1b topology frame size ${pixelSize}`);
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1B_TOPOLOGY_CANVAS} ${A1B_TOPOLOGY_CANVAS}">` +
    a1bTopologyFrameMarkup(frame) +
    '</svg>'
  );
}

export function a1bTopologyAtlasDescriptor(
  frames: readonly A1bTopologyEvidenceFrame[],
  scale: number,
): A1bTopologyAtlasDescriptor {
  if (!Number.isInteger(scale) || scale < 1) throw new Error(`Invalid A1b topology scale ${scale}`);
  if (frames.length !== A1B_TOPOLOGY_EVIDENCE_COUNT) {
    throw new Error(
      `A1b topology atlas requires ${A1B_TOPOLOGY_EVIDENCE_COUNT} frames; received ${frames.length}`,
    );
  }
  const ids = frames.map((frame) => frame.id);
  if (new Set(ids).size !== ids.length) throw new Error('A1b topology atlas frame IDs must be unique');
  const stride = A1B_TOPOLOGY_CELL_STRIDE * scale;
  const frameSize = A1B_TOPOLOGY_CANVAS * scale;
  const padding = A1B_TOPOLOGY_ATLAS_PADDING * scale;
  const entries = frames.map((frame, index) => [frame.id, {
    x: (index % A1B_TOPOLOGY_ATLAS_COLUMNS) * stride + padding,
    y: Math.floor(index / A1B_TOPOLOGY_ATLAS_COLUMNS) * stride + padding,
    w: frameSize,
    h: frameSize,
    profileCase: frame.profileCase,
    blobIndex: frame.blobIndex,
    canonicalMask: frame.canonicalMask,
    baseBlobIndex: frame.baseBlobIndex,
    ...(frame.upperBlobIndex === undefined ? {} : { upperBlobIndex: frame.upperBlobIndex }),
    stateIds: frame.stateIds,
    componentIds: frame.componentIds,
    sourceIds: frame.sourceIds,
    sourceFiles: frame.sourceFiles,
    bounds: frame.bounds,
  }] as const);
  return {
    version: 0,
    status: 'proof-only',
    contract: false,
    name: 'QuotaCo high-oblique A1b complete topology proof',
    scale,
    canvas: 128,
    frameSize,
    padding,
    columns: 11,
    rows: 9,
    width: A1B_TOPOLOGY_ATLAS_COLUMNS * stride,
    height: A1B_TOPOLOGY_ATLAS_ROWS * stride,
    pivot: { x: 0.5, y: 0.5 },
    frames: Object.fromEntries(entries),
    meta: {
      generator: 'terrarium-a1b-topology-proof',
      evidenceCount: 99,
      lowCount: 47,
      fullCount: 47,
      transitionCount: 2,
      openingCount: 3,
      completeBlobFamily: true,
      transparentPadding: true,
      temporaryFrameIds: true,
      productionRegistration: false,
      schemaChange: false,
      directionalCastShadow: false,
      note: 'Complete authored B topology evidence only. Profile cases are temporary review metadata and do not define a production export contract.',
    },
  };
}

export function a1bTopologyAtlasSvg(
  frames: readonly A1bTopologyEvidenceFrame[],
  scale: number,
): string {
  const atlas = a1bTopologyAtlasDescriptor(frames, scale);
  const cells = frames.map((frame) => {
    const rect = atlas.frames[frame.id];
    if (!rect) throw new Error(`Missing A1b topology atlas rect ${frame.id}`);
    return (
      `<svg x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" ` +
      `viewBox="0 0 ${A1B_TOPOLOGY_CANVAS} ${A1B_TOPOLOGY_CANVAS}">` +
      a1bTopologyFrameMarkup(frame) +
      '</svg>'
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" ` +
    `viewBox="0 0 ${atlas.width} ${atlas.height}">${cells}</svg>`
  );
}

export interface A1bTopologyFamily {
  readonly sources: readonly CompiledA1bTopologySource[];
  readonly components: readonly A1bTopologyComponentFrame[];
  readonly evidenceFrames: readonly A1bTopologyEvidenceFrame[];
  readonly componentManifest: A1bTopologyComponentManifest;
}

/** Compile and assemble the complete proof without registering any production asset. */
export async function loadA1bTopologyFamily(
  options: CompileA1bTopologyDirectoryOptions,
): Promise<A1bTopologyFamily> {
  const sources = await compileA1bTopologyDirectory(options);
  const components = buildA1bTopologyComponentFrames(sources);
  return {
    sources,
    components,
    evidenceFrames: buildA1bTopologyEvidenceFrames(components),
    componentManifest: a1bTopologyComponentManifest(components),
  };
}
