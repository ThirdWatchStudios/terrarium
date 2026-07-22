import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the proof-only 2xN thick-wall middle source.
 *
 * The west-side pair is authored once for mask_24. The accepted proof gate mirrors
 * the whole cell on X for mask_42. This compiler does not register either source
 * on a production/export surface.
 */

export const A1B_THICK_WALL_REPEAT_PROPOSAL_CANVAS = 128;

export const A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_IDS = [
  'filled_w_middle-base',
  'filled_w_middle-upper',
] as const;

export type A1bThickWallRepeatProposalSourceId =
  (typeof A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_IDS)[number];

export interface A1bThickWallRepeatProposalSourceSpec {
  readonly id: A1bThickWallRepeatProposalSourceId;
  readonly filename: `${A1bThickWallRepeatProposalSourceId}.svg`;
  readonly sourceMaskIndex: 24;
  readonly boundaryRole: 'west-middle';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bThickWallRepeatProposalSourceId,
  layer: 'base' | 'upper',
): A1bThickWallRepeatProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 24,
  boundaryRole: 'west-middle',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY:
readonly A1bThickWallRepeatProposalSourceSpec[] = [
  sourceSpec('filled_w_middle-base', 'base'),
  sourceSpec('filled_w_middle-upper', 'upper'),
];

export interface CompiledA1bThickWallRepeatProposalSource
  extends A1bThickWallRepeatProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bThickWallRepeatProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bThickWallRepeatProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b thick-wall repeat proof-source import: ${message}`);
    this.name = 'A1bThickWallRepeatProposalImportError';
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
    throw new A1bThickWallRepeatProposalImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

const APPROVED_PAINTS = new Set<string>([
  A1A_PALETTE.charcoal,
  A1A_PALETTE.cream,
]);

function validateSource(
  source: A1bThickWallRepeatProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bThickWallRepeatProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bThickWallRepeatProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bThickWallRepeatProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }
  if (
    source.layer === 'base' &&
    !/<path\s+id=["']base-buried-underlay["']\s+d=["']M56 0H128V128H56Z["']\s+fill=["']#252A28["']\s*\/>/.test(content)
  ) {
    throw new A1bThickWallRepeatProposalImportError(
      `${sourceFile} must retain the fully buried west-side underlay`,
    );
  }
  if (source.layer === 'upper') {
    if (
      !/<path\s+id=["']upper-contour["']\s+d=["']M56 0H128V128H56Z["']\s+fill=["']#252A28["']\s*\/>/.test(content) ||
      !/<path\s+id=["']upper-solid-top-fill["']\s+d=["']M58 0H128V128H58Z["']\s+fill=["']#D9D0B9["']\s*\/>/.test(content)
    ) {
      throw new A1bThickWallRepeatProposalImportError(
        `${sourceFile} must retain the exact open-Y spine contour and cream fill`,
      );
    }
    if (/coral|green|shade|plinth|lip|arris|seam|highlight|rollover|cap/i.test(content)) {
      throw new A1bThickWallRepeatProposalImportError(
        `${sourceFile} must not introduce a cap, fascia, shade, or internal seam`,
      );
    }
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bThickWallRepeatProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bThickWallRepeatProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bThickWallRepeatProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external proof inventory in stable order. */
export async function compileA1bThickWallRepeatProposalDirectory(
  options: CompileA1bThickWallRepeatProposalOptions,
): Promise<CompiledA1bThickWallRepeatProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bThickWallRepeatProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bThickWallRepeatProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bThickWallRepeatProposalSource[] = [];
  for (const source of A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY) {
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
