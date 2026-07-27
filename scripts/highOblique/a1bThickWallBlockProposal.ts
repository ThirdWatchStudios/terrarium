import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted proof-layer filled-elbow source bank.
 *
 * Only the west fixed-light sources are authored. The workbench derives the
 * east pair by whole-cell X mirror. Nothing here registers a production stem,
 * exporter route, atlas frame, or schema value. The accepted 47-mask ledger
 * records these external proof sources without promoting them into production.
 */

export const A1B_THICK_WALL_BLOCK_PROPOSAL_CANVAS = 128;

export const A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_IDS = [
  'filled_nw_elbow-base',
  'filled_nw_elbow-upper',
  'filled_sw_elbow-base',
  'filled_sw_elbow-upper',
] as const;

export type A1bThickWallBlockProposalSourceId =
  (typeof A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_IDS)[number];

export interface A1bThickWallBlockProposalSourceSpec {
  readonly id: A1bThickWallBlockProposalSourceId;
  readonly filename: `${A1bThickWallBlockProposalSourceId}.svg`;
  readonly sourceMaskIndex: 16 | 20;
  readonly boundaryRole: 'rear-west' | 'foreground-west';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bThickWallBlockProposalSourceId,
  sourceMaskIndex: 16 | 20,
  boundaryRole: 'rear-west' | 'foreground-west',
  layer: 'base' | 'upper',
): A1bThickWallBlockProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  boundaryRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY:
readonly A1bThickWallBlockProposalSourceSpec[] = [
  sourceSpec('filled_nw_elbow-base', 20, 'rear-west', 'base'),
  sourceSpec('filled_nw_elbow-upper', 20, 'rear-west', 'upper'),
  sourceSpec('filled_sw_elbow-base', 16, 'foreground-west', 'base'),
  sourceSpec('filled_sw_elbow-upper', 16, 'foreground-west', 'upper'),
];

export interface CompiledA1bThickWallBlockProposalSource
  extends A1bThickWallBlockProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bThickWallBlockProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bThickWallBlockProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b thick-wall block proof-source import: ${message}`);
    this.name = 'A1bThickWallBlockProposalImportError';
  }
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

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
    throw new A1bThickWallBlockProposalImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

const APPROVED_PAINTS = new Set<string>([
  A1A_PALETTE.charcoal,
  A1A_PALETTE.cream,
  A1A_PALETTE.coral,
  A1A_PALETTE.green,
  '#FFFFFF',
  '#000000',
]);

function validateSource(
  source: A1bThickWallBlockProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }
  if (source.layer === 'upper' && !/\bid=["']upper-solid-top-fill["']/.test(content)) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must own one upper-solid-top-fill quadrant`,
    );
  }
  if (source.id === 'filled_sw_elbow-upper' && !/\bid=["']upper-boundary-seam["']/.test(content)) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must retain the foreground boundary seam for the accepted southeast filter`,
    );
  }
  if (
    source.id === 'filled_sw_elbow-upper' &&
    !/<path\s+id=["']upper-south-face-shade["']\s+d=["']M58 63H128V84H58Z["']\s+fill=["']#000000["']\s+opacity=["']0\.08["']\s*\/>/.test(content)
  ) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must retain the standard south-facing cream material shade`,
    );
  }
  if (
    source.id === 'filled_sw_elbow-upper' &&
    !/<path\s+id=["']upper-lip-seam["']\s+d=["']M59 87H127["'][^>]*stroke=["']#252A28["'][^>]*stroke-width=["']1\.5["'][^>]*opacity=["']0\.45["']\s*\/>/.test(content)
  ) {
    throw new A1bThickWallBlockProposalImportError(
      `${sourceFile} must retain the accepted dark lip seam above the coral return`,
    );
  }
  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bThickWallBlockProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bThickWallBlockProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bThickWallBlockProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file proposal inventory in stable order. */
export async function compileA1bThickWallBlockProposalDirectory(
  options: CompileA1bThickWallBlockProposalOptions,
): Promise<CompiledA1bThickWallBlockProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bThickWallBlockProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bThickWallBlockProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bThickWallBlockProposalSource[] = [];
  for (const source of A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY) {
    const sourceFile = `${prefix}/${source.filename}`;
    const content = await readFile(path.join(options.inputDir, source.filename), 'utf8');
    compiled.push({
      ...source,
      sourceFile,
      content,
      shapes: validateSource(source, sourceFile, content),
    });
  }
  return compiled;
}
