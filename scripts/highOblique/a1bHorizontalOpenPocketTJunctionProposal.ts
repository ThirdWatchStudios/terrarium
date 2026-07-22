import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only horizontal-spine open-pocket T sources. */

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_s_t_junction-base',
  'open_s_t_junction-upper',
  'open_n_t_junction-base',
  'open_n_t_junction-upper',
] as const;

export type A1bHorizontalOpenPocketTJunctionProposalSourceId =
  (typeof A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bHorizontalOpenPocketTJunctionProposalSourceSpec {
  readonly id: A1bHorizontalOpenPocketTJunctionProposalSourceId;
  readonly filename: `${A1bHorizontalOpenPocketTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 11 | 14;
  readonly boundaryRole: 'foreground-open-t-hub' | 'rear-open-t-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bHorizontalOpenPocketTJunctionProposalSourceId,
  sourceMaskIndex: 11 | 14,
  boundaryRole: 'foreground-open-t-hub' | 'rear-open-t-hub',
  layer: 'base' | 'upper',
): A1bHorizontalOpenPocketTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  boundaryRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bHorizontalOpenPocketTJunctionProposalSourceSpec[] = [
  sourceSpec('open_s_t_junction-base', 11, 'foreground-open-t-hub', 'base'),
  sourceSpec('open_s_t_junction-upper', 11, 'foreground-open-t-hub', 'upper'),
  sourceSpec('open_n_t_junction-base', 14, 'rear-open-t-hub', 'base'),
  sourceSpec('open_n_t_junction-upper', 14, 'rear-open-t-hub', 'upper'),
];

export interface CompiledA1bHorizontalOpenPocketTJunctionProposalSource
  extends A1bHorizontalOpenPocketTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bHorizontalOpenPocketTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bHorizontalOpenPocketTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b horizontal open-pocket T-junction proof-source import: ${message}`);
    this.name = 'A1bHorizontalOpenPocketTJunctionProposalImportError';
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
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
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

const REQUIRED_SOURCE_IDS: Readonly<
Record<A1bHorizontalOpenPocketTJunctionProposalSourceId, readonly string[]>
> = {
  'open_s_t_junction-base': [
    'detail/base',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
  ],
  'open_s_t_junction-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light',
    'upper-arris-lip',
    'upper-green-handoff',
    'upper-coral-band',
    'upper-band-light',
    'upper-face-shade',
    'upper-cream-bridge',
    'upper-reveal-light',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
  ],
  'open_n_t_junction-base': [
    'detail/base',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_n_t_junction-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-horizontal-coral-band',
    'upper-horizontal-band-light',
    'upper-horizontal-green-handoff',
    'upper-cream-bridge',
    'upper-reveal-light',
    'upper-plane-light',
    'upper-arris-lip',
    'upper-branch-coral-band',
    'upper-branch-green-handoff',
    'upper-face-shade',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
    'upper-south-service-seam',
  ],
};

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

function validateSource(
  source: A1bHorizontalOpenPocketTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|four-way)/i.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, or four-way hub`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file external proposal inventory in stable order. */
export async function compileA1bHorizontalOpenPocketTJunctionProposalDirectory(
  options: CompileA1bHorizontalOpenPocketTJunctionProposalOptions,
): Promise<CompiledA1bHorizontalOpenPocketTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bHorizontalOpenPocketTJunctionProposalSource[] = [];
  for (const source of A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
