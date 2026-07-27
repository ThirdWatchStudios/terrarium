import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the accepted proof-only mask_23 southeast-filled four-way source pair. */

export const A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_se-base',
  'open_cross_filled_se-upper',
] as const;

export type A1bSingleFilledSoutheastCrossJunctionProposalSourceId =
  (typeof A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bSingleFilledSoutheastCrossJunctionProposalSourceSpec {
  readonly id: A1bSingleFilledSoutheastCrossJunctionProposalSourceId;
  readonly filename: `${A1bSingleFilledSoutheastCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 23;
  readonly boundaryRole: 'southeast-filled-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bSingleFilledSoutheastCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bSingleFilledSoutheastCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 23,
  boundaryRole: 'southeast-filled-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bSingleFilledSoutheastCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_se-base', 'base'),
  sourceSpec('open_cross_filled_se-upper', 'upper'),
];

export interface CompiledA1bSingleFilledSoutheastCrossJunctionProposalSource
  extends A1bSingleFilledSoutheastCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bSingleFilledSoutheastCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bSingleFilledSoutheastCrossJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b single-filled southeast cross-junction proof-source import: ${message}`);
    this.name = 'A1bSingleFilledSoutheastCrossJunctionProposalImportError';
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
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
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
Record<A1bSingleFilledSoutheastCrossJunctionProposalSourceId, readonly string[]>
> = {
  'open_cross_filled_se-base': [
    'detail/base',
    'base-buried-se-underlay',
    'base-contour-open-ne',
    'base-green-open-ne',
    'base-face-shade-open-ne',
    'base-contact-shade-open-ne',
    'base-contour-open-sw',
    'base-green-open-sw',
    'base-face-shade-open-sw',
    'base-contact-shade-open-sw',
  ],
  'open_cross_filled_se-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light-open-ne',
    'upper-arris-lip-open-ne',
    'upper-reveal-light-open-nw',
    'upper-solid-top-highlight',
    'upper-green-open-ne',
    'upper-coral-open-ne',
    'upper-face-shade-open-ne',
    'upper-coral-open-sw',
    'upper-band-light-open-sw',
    'upper-green-open-sw',
    'upper-face-shade-open-sw',
    'upper-arris-seam',
    'upper-band-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bSingleFilledSoutheastCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_se-base': [
    ['base-buried-se-underlay', 'M11.5 11.5L128 11.5 128 128 11.5 128Z'],
  ],
  'open_cross_filled_se-upper': [
    [
      'upper-contour',
      'M11.5 0L92.804 0 92.804 9.446C92.804 10.581 100.232 11.5 109.396 11.5L128 11.5 128 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'upper-shell',
      'M14.819 0L89.485 0 89.485 9.857C89.485 10.991 96.914 14.819 106.078 14.819L128 14.819 128 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
    ],
    [
      'upper-plane-light-open-ne',
      'M14.819 0L68.744 0 68.744 9.036C68.744 10.397 77.66 11.5 88.656 11.5L14.819 11.5Z',
    ],
    [
      'upper-arris-lip-open-ne',
      'M68.744 0L71.233 0 71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L88.656 11.5C77.66 11.5 68.744 10.397 68.744 9.036Z',
    ],
    [
      'upper-green-open-ne',
      'M87.826 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L107.737 11.5C96.741 11.5 87.826 10.397 87.826 9.036Z',
    ],
    [
      'upper-coral-open-ne',
      'M79.53 0L87.826 0 87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5L99.441 11.5C88.445 11.5 79.53 10.397 79.53 9.036Z',
    ],
    [
      'upper-face-shade-open-ne',
      'M71.233 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L91.144 11.5C80.149 11.5 71.233 10.397 71.233 9.036Z',
    ],
    [
      'upper-arris-seam',
      'M71.233 0.75L71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L111.056 11.5M0.75 23.115L126 23.115',
    ],
    [
      'upper-band-seam',
      'M87.826 0.75L87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5M0.75 74.552L9.857 74.552',
    ],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-se-solid-top',
  'upper-cream-bridge',
  'upper-secondary-cream',
] as const;

const FORBIDDEN_BURIED_FACE_IDS = [
  'upper-coral-filled-se',
  'upper-green-filled-se',
  'upper-face-shade-filled-se',
  'upper-interior-riser',
] as const;

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

const creamPathOwners = (content: string): readonly string[] =>
  [...content.matchAll(
    /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
  )].map((match) => match[1]);

function validateSource(
  source: A1bSingleFilledSoutheastCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (/<(?:use|image)\b/i.test(content) || /\b(?:href|xlink:href)\s*=/.test(content)) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateCreamOwners.length > 0) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const buriedFaceIds = FORBIDDEN_BURIED_FACE_IDS.filter((id) => ids.includes(id));
  if (buriedFaceIds.length > 0) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} reintroduces buried southeast face geometry through ${buriedFaceIds.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must retain exact southeast-union geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked)/i.test(content)) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external review inventory in stable order. */
export async function compileA1bSingleFilledSoutheastCrossJunctionProposalDirectory(
  options: CompileA1bSingleFilledSoutheastCrossJunctionProposalOptions,
): Promise<CompiledA1bSingleFilledSoutheastCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bSingleFilledSoutheastCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bSingleFilledSoutheastCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
  ) {
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
