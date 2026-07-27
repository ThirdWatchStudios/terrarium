import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted, proof-layer equal-height mask_0 source bank.
 *
 * The pair deliberately lives outside the canonical Building System directory.
 * Compiling it preserves editable source provenance without adding a production stem,
 * exporter route, atlas frame, schema value, or accepted mask mapping.
 */

export const A1B_ISOLATED_SHELL_PROPOSAL_CANVAS = 128;

export const A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_IDS = [
  'isolated_shell-base',
  'isolated_shell-upper',
] as const;

export type A1bIsolatedShellProposalSourceId =
  (typeof A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_IDS)[number];

export interface A1bIsolatedShellProposalSourceSpec {
  readonly id: A1bIsolatedShellProposalSourceId;
  readonly filename: `${A1bIsolatedShellProposalSourceId}.svg`;
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bIsolatedShellProposalSourceId,
  layer: 'base' | 'upper',
): A1bIsolatedShellProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_INVENTORY:
readonly A1bIsolatedShellProposalSourceSpec[] = [
  sourceSpec('isolated_shell-base', 'base'),
  sourceSpec('isolated_shell-upper', 'upper'),
];

export interface CompiledA1bIsolatedShellProposalSource
  extends A1bIsolatedShellProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bIsolatedShellProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bIsolatedShellProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b isolated shell proof-source import: ${message}`);
    this.name = 'A1bIsolatedShellProposalImportError';
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
    throw new A1bIsolatedShellProposalImportError(
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
  source: A1bIsolatedShellProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bIsolatedShellProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bIsolatedShellProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bIsolatedShellProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }
  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bIsolatedShellProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bIsolatedShellProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bIsolatedShellProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file proposal inventory in stable order. */
export async function compileA1bIsolatedShellProposalDirectory(
  options: CompileA1bIsolatedShellProposalOptions,
): Promise<CompiledA1bIsolatedShellProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bIsolatedShellProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bIsolatedShellProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bIsolatedShellProposalSource[] = [];
  for (const source of A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_INVENTORY) {
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
