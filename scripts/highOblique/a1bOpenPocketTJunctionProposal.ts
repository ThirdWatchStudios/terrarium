import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only open-pocket T-junction source pair. */

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_w_t_junction-base',
  'open_w_t_junction-upper',
] as const;

export type A1bOpenPocketTJunctionProposalSourceId =
  (typeof A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bOpenPocketTJunctionProposalSourceSpec {
  readonly id: A1bOpenPocketTJunctionProposalSourceId;
  readonly filename: `${A1bOpenPocketTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 7;
  readonly boundaryRole: 'open-west-t-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bOpenPocketTJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bOpenPocketTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 7,
  boundaryRole: 'open-west-t-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bOpenPocketTJunctionProposalSourceSpec[] = [
  sourceSpec('open_w_t_junction-base', 'base'),
  sourceSpec('open_w_t_junction-upper', 'upper'),
];

export interface CompiledA1bOpenPocketTJunctionProposalSource
  extends A1bOpenPocketTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bOpenPocketTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bOpenPocketTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b open-pocket T-junction proof-source import: ${message}`);
    this.name = 'A1bOpenPocketTJunctionProposalImportError';
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
    throw new A1bOpenPocketTJunctionProposalImportError(
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

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

function validateSource(
  source: A1bOpenPocketTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }

  if (source.layer === 'base') {
    const required = [
      ['base-contour', 'M89.485 0L117.693 0 117.693 76.211 128 76.211 128 117.693 117.693 117.693 117.693 128 89.485 128 89.485 117.693 21.456 117.693 21.456 76.211 89.485 76.211Z'],
      ['base-green', 'M92.804 0L112.715 0 112.715 74.552C112.715 77.301 114.943 79.53 117.693 79.53L128 79.53 128 112.715 117.693 112.715C114.943 112.715 112.715 114.943 112.715 117.693L112.715 128 92.804 128Z'],
      ['base-contact-shade', 'M117.693 0L123.5 0 123.5 76.211 117.693 76.211ZM117.693 117.693L128 117.693 128 123.5 123.5 123.5 123.5 128 117.693 128Z'],
      ['base-boundary-seam', 'M126 81.189L126 111.056'],
      ['base-south-service-seam', 'M94.463 126L111.056 126'],
    ] as const;
    if (required.some(([id, d]) => !requiredPath(content, id, d))) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the exact open-west T base and seam ownership`,
      );
    }
  } else {
    const required = [
      ['upper-contour', 'M11.5 0L92.804 0 92.804 9.857C92.804 10.764 98.747 11.5 106.078 11.5L128 11.5 128 79.53 92.804 79.53 92.804 128 11.5 128Z'],
      ['upper-shell', 'M14.819 0L89.485 0 89.485 10.063C89.485 11.083 96.17 14.819 104.419 14.819L128 14.819 128 76.211 89.485 76.211 89.485 128 14.819 128Z'],
      ['upper-cream-bridge', 'M71.233 14.819L128 14.819 128 64.596 71.233 64.596Z'],
      ['upper-reveal-light', 'M71.233 14.819L128 14.819 128 23.115 71.233 23.115Z'],
      ['upper-coral-band', 'M79.53 0L87.826 0 87.826 54.641C87.826 60.14 92.283 64.596 97.781 64.596L128 64.596 128 74.552 87.826 74.552 87.826 128 79.53 128Z'],
      ['upper-green-handoff', 'M87.826 0L92.804 0 92.804 69.574C92.804 72.323 95.032 74.552 97.781 74.552L128 74.552 128 79.53 97.781 79.53C95.032 79.53 92.804 81.758 92.804 84.507L92.804 128 87.826 128Z'],
      ['upper-arris-seam', 'M71.233 0.75L71.233 127M71.233 23.115L127 23.115'],
      ['upper-band-seam', 'M87.826 0.75L87.826 14.819M87.826 74.552L87.826 127M71.233 74.552L127 74.552'],
      ['upper-boundary-seam', 'M126 24.774L126 77.87'],
      ['upper-south-service-seam', 'M14.819 126L91.144 126'],
    ] as const;
    if (required.some(([id, d]) => !requiredPath(content, id, d))) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the exact molded T shell and outgoing seam ownership`,
      );
    }
    if (/\bid=["'][^"']*(?:cap|post|rollover|four-way)/i.test(content)) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must not introduce a cap, post, rollover, or four-way hub`,
      );
    }
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bOpenPocketTJunctionProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bOpenPocketTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external proposal inventory in stable order. */
export async function compileA1bOpenPocketTJunctionProposalDirectory(
  options: CompileA1bOpenPocketTJunctionProposalOptions,
): Promise<CompiledA1bOpenPocketTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bOpenPocketTJunctionProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bOpenPocketTJunctionProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bOpenPocketTJunctionProposalSource[] = [];
  for (const source of A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
