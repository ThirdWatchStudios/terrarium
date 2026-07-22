import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the owner-accepted proof-only N×2 thick-wall middle source pairs. */

export const A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_CANVAS = 128;

export const A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_IDS = [
  'filled_n_middle-base',
  'filled_n_middle-upper',
  'filled_s_middle-base',
  'filled_s_middle-upper',
] as const;

export type A1bThickWallHorizontalRepeatProposalSourceId =
  (typeof A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_IDS)[number];

export interface A1bThickWallHorizontalRepeatProposalSourceSpec {
  readonly id: A1bThickWallHorizontalRepeatProposalSourceId;
  readonly filename: `${A1bThickWallHorizontalRepeatProposalSourceId}.svg`;
  readonly sourceMaskIndex: 31 | 38;
  readonly boundaryRole: 'rear-middle' | 'foreground-middle';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bThickWallHorizontalRepeatProposalSourceId,
  sourceMaskIndex: 31 | 38,
  boundaryRole: 'rear-middle' | 'foreground-middle',
  layer: 'base' | 'upper',
): A1bThickWallHorizontalRepeatProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  boundaryRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY:
readonly A1bThickWallHorizontalRepeatProposalSourceSpec[] = [
  sourceSpec('filled_n_middle-base', 31, 'rear-middle', 'base'),
  sourceSpec('filled_n_middle-upper', 31, 'rear-middle', 'upper'),
  sourceSpec('filled_s_middle-base', 38, 'foreground-middle', 'base'),
  sourceSpec('filled_s_middle-upper', 38, 'foreground-middle', 'upper'),
];

export interface CompiledA1bThickWallHorizontalRepeatProposalSource
  extends A1bThickWallHorizontalRepeatProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bThickWallHorizontalRepeatProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bThickWallHorizontalRepeatProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b thick-wall horizontal repeat proof-source import: ${message}`);
    this.name = 'A1bThickWallHorizontalRepeatProposalImportError';
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
    throw new A1bThickWallHorizontalRepeatProposalImportError(
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
  source: A1bThickWallHorizontalRepeatProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bThickWallHorizontalRepeatProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bThickWallHorizontalRepeatProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bThickWallHorizontalRepeatProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }

  if (source.id === 'filled_n_middle-base') {
    if (!content.includes('id="base-buried-underlay" d="M0 56H128V128H0Z"')) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must retain the rear buried underlay`,
      );
    }
  }
  if (source.id === 'filled_s_middle-base') {
    if (
      !content.includes('id="base-contact-shade" d="M 0 120 H 128 V 123.5 H 0 Z"') ||
      !content.includes('id="base-boundary-seam" d="M 126 98 V 116"')
    ) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must retain the accepted frontage base and contact finish`,
      );
    }
  }
  if (source.id === 'filled_n_middle-upper') {
    if (
      !content.includes('id="upper-contour" d="M0 56H128V128H0Z"') ||
      !content.includes('id="upper-solid-top-fill" d="M0 58H128V128H0Z"') ||
      !content.includes('id="upper-solid-top-highlight" d="M0 58H128V63H0Z"')
    ) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must retain the exact open-X rear span`,
      );
    }
    if (/coral|green|shade|plinth|seam|cap|rollover/i.test(content)) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must not claim foreground fascia or an internal seam`,
      );
    }
  }
  if (source.id === 'filled_s_middle-upper') {
    const required = [
      'id="upper-contour" d="M0 0H128V120H0Z"',
      'id="upper-solid-top-fill" d="M0 0H128V97H0Z"',
      'id="upper-south-face-shade" d="M0 63H128V88H0Z" fill="#000000" opacity="0.08"',
      'id="upper-south-coral-wrap" d="M0 88H128V94H0Z"',
      'id="upper-south-green-wrap" d="M0 94H128V117H0Z"',
      'id="upper-south-plinth" d="M0 117H128V120H0Z"',
      'id="upper-boundary-seam" d="M126 88V96 M126 98V116"',
    ];
    if (required.some((fragment) => !content.includes(fragment))) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must retain the exact open-X foreground plane stack`,
      );
    }
    if (/\bid=["'][^"']*(?:arris|cap|rollover)/i.test(content)) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile} must not introduce an arris, cap, or rollover`,
      );
    }
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bThickWallHorizontalRepeatProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bThickWallHorizontalRepeatProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file external proof inventory in stable order. */
export async function compileA1bThickWallHorizontalRepeatProposalDirectory(
  options: CompileA1bThickWallHorizontalRepeatProposalOptions,
): Promise<CompiledA1bThickWallHorizontalRepeatProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bThickWallHorizontalRepeatProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bThickWallHorizontalRepeatProposalSource[] = [];
  for (const source of A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY) {
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
