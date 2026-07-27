import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted mask_46 fully filled center pair.
 *
 * The source stays outside the canonical Building System bank. Compilation
 * validates editable proof provenance only; it does not promote the ledger or
 * create production/export/atlas/schema/blob/Unity registration.
 */

export const A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'filled_center-base',
  'filled_center-upper',
] as const;

export type A1bFullyFilledCrossJunctionProposalSourceId =
  (typeof A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bFullyFilledCrossJunctionProposalSourceSpec {
  readonly id: A1bFullyFilledCrossJunctionProposalSourceId;
  readonly filename:
    `${A1bFullyFilledCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 46;
  readonly boundaryRole: 'fully-buried-solid-center';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bFullyFilledCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bFullyFilledCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 46,
  boundaryRole: 'fully-buried-solid-center',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bFullyFilledCrossJunctionProposalSourceSpec[] = [
  sourceSpec('filled_center-base', 'base'),
  sourceSpec('filled_center-upper', 'upper'),
];

export interface CompiledA1bFullyFilledCrossJunctionProposalSource
  extends A1bFullyFilledCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bFullyFilledCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bFullyFilledCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(`A1b fully filled cross-junction proof-source import: ${message}`);
    this.name = 'A1bFullyFilledCrossJunctionProposalImportError';
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
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

const SOURCE_CONTRACT: Readonly<
Record<
  A1bFullyFilledCrossJunctionProposalSourceId,
  {
    readonly shapeId: 'base-buried-underlay' | 'upper-solid-top-fill';
    readonly fill: string;
  }
>
> = {
  'filled_center-base': {
    shapeId: 'base-buried-underlay',
    fill: A1A_PALETTE.charcoal,
  },
  'filled_center-upper': {
    shapeId: 'upper-solid-top-fill',
    fill: A1A_PALETTE.cream,
  },
};

const FULL_CELL_PATH = 'M0 0H128V128H0Z';
const DRAWABLE_TAG_PATTERN =
  /<(path|rect|circle|ellipse|line|polyline|polygon|text|use|image|foreignObject)\b([^>]*)>/gi;

function validateSource(
  source: A1bFullyFilledCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=|\brotate\s*\(/i.test(content)) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    !new RegExp(
      `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
    ).test(content)
  ) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must declare ${source.semanticGroup}`,
    );
  }

  const expected = SOURCE_CONTRACT[source.id];
  const drawables = [...content.matchAll(DRAWABLE_TAG_PATTERN)];
  if (drawables.length !== 1) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must contain exactly one drawable path`,
    );
  }
  const [tag, attributes] = [drawables[0][1], drawables[0][2]];
  const id = /\bid=["']([^"']+)["']/.exec(attributes)?.[1];
  if (tag !== 'path' || id !== expected.shapeId) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} drawable must be path ${expected.shapeId}`,
    );
  }
  if (
    !content.includes(
      `<path id="${expected.shapeId}" d="${FULL_CELL_PATH}" fill="${expected.fill}"/>`,
    )
  ) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must use the exact full-cell ${expected.fill} field`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length !== 1 || shapes[0].silhouette !== false) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} must compile to one detail-art shape`,
    );
  }
  if (
    shapes[0].fill !== expected.fill ||
    (shapes[0].stroke !== undefined && shapes[0].stroke !== 'none')
  ) {
    throw new A1bFullyFilledCrossJunctionProposalImportError(
      `${sourceFile} paint or stroke drift`,
    );
  }
  return shapes;
}

/** Compile the exact two-file accepted proof inventory in stable order. */
export async function compileA1bFullyFilledCrossJunctionProposalDirectory(
  options: CompileA1bFullyFilledCrossJunctionProposalOptions,
): Promise<CompiledA1bFullyFilledCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
      .map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bFullyFilledCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bFullyFilledCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bFullyFilledCrossJunctionProposalSource[] = [];
  for (
    const source
    of A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
  ) {
    const sourceFile = `${prefix}/${source.filename}`;
    const content = await readFile(
      path.join(options.inputDir, source.filename),
      'utf8',
    );
    compiled.push({
      ...source,
      sourceFile,
      content,
      shapes: validateSource(source, sourceFile, content),
    });
  }
  return compiled;
}
