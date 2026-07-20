import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { compileAuthoredSvg } from '../parts/importer';
import {
  A1A_COMPARISON_STEMS,
  A1A_PALETTE,
  getA1aProofFrame,
  type A1aComparisonStem,
  type A1aProofFrame,
  type A1aShape,
} from './a1aProof';

/**
 * Proof-only authored-source seam for the approved A1b split-B family.
 *
 * The compiler deliberately stops at strict SVG validation and A1a review
 * shapes. It does not register wall templates, emit a production registry,
 * alter the 47-blob atlas, or define an export/schema contract.
 */

export const A1B_AUTHORED_B_COMPONENTS = ['base', 'upper'] as const;

export type A1bAuthoredBComponent = (typeof A1B_AUTHORED_B_COMPONENTS)[number];
export type A1bAuthoredBFrameId = `b_${A1aComparisonStem}`;
export type A1bAuthoredBComponentId = `${A1bAuthoredBFrameId}/${A1bAuthoredBComponent}`;

export interface A1bAuthoredBSourceSpec {
  readonly id: A1bAuthoredBComponentId;
  readonly frameId: A1bAuthoredBFrameId;
  readonly stem: A1aComparisonStem;
  readonly component: A1bAuthoredBComponent;
  readonly filename: string;
}

export interface CompiledA1bAuthoredBComponent extends A1bAuthoredBSourceSpec {
  readonly sourceFile: string;
  readonly shapes: readonly A1aShape[];
}

export interface CompileA1bAuthoredBDirectoryOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export interface A1bAuthoredBFamily {
  readonly components: readonly CompiledA1bAuthoredBComponent[];
  readonly frames: readonly A1aProofFrame[];
}

function componentId(
  stem: A1aComparisonStem,
  component: A1bAuthoredBComponent,
): A1bAuthoredBComponentId {
  return `b_${stem}/${component}`;
}

function sourceSpec(
  stem: A1aComparisonStem,
  component: A1bAuthoredBComponent,
): A1bAuthoredBSourceSpec {
  return {
    id: componentId(stem, component),
    frameId: `b_${stem}`,
    stem,
    component,
    filename: `${stem}-${component}.svg`,
  };
}

/** Stable source order: each frame's base immediately followed by its upper. */
export const A1B_AUTHORED_B_SOURCE_INVENTORY: readonly A1bAuthoredBSourceSpec[] =
  A1A_COMPARISON_STEMS.flatMap((stem) =>
    A1B_AUTHORED_B_COMPONENTS.map((component) => sourceSpec(stem, component)));

export const A1B_AUTHORED_B_COMPONENT_IDS: readonly A1bAuthoredBComponentId[] =
  A1B_AUTHORED_B_SOURCE_INVENTORY.map((entry) => entry.id);

export class A1bAuthoredBImportError extends Error {
  constructor(message: string) {
    super(`A1b authored B import: ${message}`);
    this.name = 'A1bAuthoredBImportError';
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
    throw new A1bAuthoredBImportError('sourcePathPrefix must be repository-relative');
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
  throw new A1bAuthoredBImportError(
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
    throw new A1bAuthoredBImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix recolorable and literal paint`,
    );
  }
  if (fillToken && strokeToken && fillToken !== strokeToken) {
    throw new A1bAuthoredBImportError(
      `${sourceFile}/shape-${shapeIndex + 1} cannot mix palette tokens ${fillToken} and ${strokeToken}`,
    );
  }
}

function compileComponentShapes(
  source: A1bAuthoredBSourceSpec,
  sourceFile: string,
  input: string,
): A1aShape[] {
  const semanticGroup = new RegExp(`\\bid\\s*=\\s*["']detail/${source.component}["']`);
  if (!semanticGroup.test(input)) {
    throw new A1bAuthoredBImportError(
      `${sourceFile} must declare a detail/${source.component} source group`,
    );
  }
  const compiled = compileAuthoredSvg(input, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  const layer = source.component;
  const shapes = compiled.map((entry, shapeIndex): A1aShape => {
    if (entry.silhouette !== false) {
      throw new A1bAuthoredBImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must live under detail/${source.component} art`,
      );
    }
    const fill = remapPaint(sourceFile, shapeIndex, 'fill', entry.fill);
    const stroke = remapPaint(sourceFile, shapeIndex, 'stroke', entry.stroke);
    validatePaintPurity(sourceFile, shapeIndex, fill, stroke);
    return {
      ...entry,
      layer,
      ...(fill === undefined ? {} : { fill }),
      ...(stroke === undefined ? {} : { stroke }),
    };
  });
  if (!shapes.some((entry) => paletteToken(entry.fill) || paletteToken(entry.stroke))) {
    throw new A1bAuthoredBImportError(
      `${sourceFile} must contain at least one cream, green, or teal product field`,
    );
  }
  return shapes;
}

/**
 * Compile the complete 18-file B family atomically in memory.
 *
 * The source directory may also contain `README.md` and the separately strict
 * `topology/` and `low-profile-correction/` proof banks. Every other file or
 * directory is rejected so a stray or half-authored pilot frame cannot silently
 * escape the declared inventory.
 */
export async function compileA1bAuthoredBDirectory(
  options: CompileA1bAuthoredBDirectoryOptions,
): Promise<CompiledA1bAuthoredBComponent[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expectedFiles = new Set(A1B_AUTHORED_B_SOURCE_INVENTORY.map((entry) => entry.filename));
  const actualFiles = new Set<string>();

  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (
      entry.isDirectory() &&
      (entry.name === 'topology' || entry.name === 'low-profile-correction')
    ) continue;
    if (!entry.isFile() || !expectedFiles.has(entry.name)) {
      throw new A1bAuthoredBImportError(`unexpected source ${entry.name}`);
    }
    actualFiles.add(entry.name);
  }
  for (const expected of expectedFiles) {
    if (!actualFiles.has(expected)) {
      throw new A1bAuthoredBImportError(`missing source ${expected}`);
    }
  }

  const compiled: CompiledA1bAuthoredBComponent[] = [];
  for (const source of A1B_AUTHORED_B_SOURCE_INVENTORY) {
    const sourceFile = `${prefix}/${source.filename}`;
    const input = await readFile(path.join(options.inputDir, source.filename), 'utf8');
    compiled.push({
      ...source,
      sourceFile,
      shapes: compileComponentShapes(source, sourceFile, input),
    });
  }
  return compiled;
}

/** Compose the complete authored base+upper pairs into the existing B frame ids. */
export function assembleA1bAuthoredBFrames(
  components: readonly CompiledA1bAuthoredBComponent[],
): A1aProofFrame[] {
  const byId = new Map<A1bAuthoredBComponentId, CompiledA1bAuthoredBComponent>();
  for (const component of components) {
    if (byId.has(component.id)) {
      throw new A1bAuthoredBImportError(`duplicate compiled component ${component.id}`);
    }
    byId.set(component.id, component);
  }
  if (byId.size !== A1B_AUTHORED_B_COMPONENT_IDS.length) {
    throw new A1bAuthoredBImportError(
      `compiled component inventory has ${byId.size} entries; expected ${A1B_AUTHORED_B_COMPONENT_IDS.length}`,
    );
  }

  return A1A_COMPARISON_STEMS.map((stem) => {
    const frameId: A1bAuthoredBFrameId = `b_${stem}`;
    const base = byId.get(componentId(stem, 'base'));
    const upper = byId.get(componentId(stem, 'upper'));
    if (!base || !upper) {
      throw new A1bAuthoredBImportError(`missing compiled base or upper for ${frameId}`);
    }
    const existing = getA1aProofFrame(frameId);
    return {
      id: frameId,
      label: existing.label,
      construction: 'b-split',
      comparisonStem: stem,
      pivot: { ...existing.pivot },
      shapes: [...base.shapes, ...upper.shapes],
    };
  });
}

/** Compile and compose one complete authored B family without registering it. */
export async function loadA1bAuthoredBFamily(
  options: CompileA1bAuthoredBDirectoryOptions,
): Promise<A1bAuthoredBFamily> {
  const components = await compileA1bAuthoredBDirectory(options);
  return {
    components,
    frames: assembleA1bAuthoredBFrames(components),
  };
}
