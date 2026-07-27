import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the owner-accepted proof-layer mask_39 source pair. */

export const A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_n-base',
  'open_cross_filled_n-upper',
] as const;

export type A1bDoubleFilledNorthCrossJunctionProposalSourceId =
  (typeof A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bDoubleFilledNorthCrossJunctionProposalSourceSpec {
  readonly id: A1bDoubleFilledNorthCrossJunctionProposalSourceId;
  readonly filename: `${A1bDoubleFilledNorthCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 39;
  readonly boundaryRole: 'double-filled-north-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bDoubleFilledNorthCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bDoubleFilledNorthCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 39,
  boundaryRole: 'double-filled-north-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bDoubleFilledNorthCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_n-base', 'base'),
  sourceSpec('open_cross_filled_n-upper', 'upper'),
];

export interface CompiledA1bDoubleFilledNorthCrossJunctionProposalSource
  extends A1bDoubleFilledNorthCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bDoubleFilledNorthCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bDoubleFilledNorthCrossJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b double-filled north cross-junction proof-source import: ${message}`);
    this.name = 'A1bDoubleFilledNorthCrossJunctionProposalImportError';
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
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
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
Record<
  A1bDoubleFilledNorthCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_n-base': [
    'detail/base',
    'base-buried-north-underlay',
    'base-contour-exposed-south',
    'base-green-exposed-south',
    'base-face-shade-exposed-south',
    'base-contact-shade-exposed-south',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_cross_filled_n-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-horizontal-face-shade',
    'upper-south-plane-light',
    'upper-south-arris-lip',
    'upper-coral-band',
    'upper-band-light',
    'upper-green-handoff',
    'upper-south-face-shade',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
    'upper-south-service-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bDoubleFilledNorthCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_n-base': [
    ['base-buried-north-underlay', 'M0 0L128 0 128 76.211 0 76.211Z'],
    [
      'base-contour-exposed-south',
      'M89.485 76.211L128 76.211 128 117.693 117.693 117.693 117.693 128 89.485 128 89.485 117.693 0 117.693 0 76.211Z',
    ],
    [
      'base-green-exposed-south',
      'M92.804 74.552C92.804 77.301 95.032 79.53 97.781 79.53L128 79.53 128 112.715 117.693 112.715C114.943 112.715 112.715 114.943 112.715 117.693L112.715 128 92.804 128 92.804 117.693C92.804 114.943 90.575 112.715 87.826 112.715L0 112.715 0 79.53 87.826 79.53C90.575 79.53 92.804 77.301 92.804 74.552Z',
    ],
  ],
  'open_cross_filled_n-upper': [
    [
      'upper-contour',
      'M0 0L128 0 128 79.53 109.396 79.53C100.232 79.53 92.804 86.958 92.804 96.122L92.804 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53Z',
    ],
    [
      'upper-shell',
      'M0 0L128 0 128 76.211 106.078 76.211C96.914 76.211 89.485 83.64 89.485 92.804L89.485 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211Z',
    ],
    [
      'upper-horizontal-face-shade',
      'M0 23.115L14.819 23.115 14.819 64.596 0 64.596ZM92.804 23.115L128 23.115 128 64.596 92.804 64.596Z',
    ],
    [
      'upper-coral-band',
      'M0 64.596L14.819 64.596 14.819 74.552 0 74.552ZM79.53 128L79.53 74.552 128 74.552 128 64.596 97.781 64.596C92.283 64.596 87.826 69.053 87.826 74.552L87.826 128Z',
    ],
    [
      'upper-band-light',
      'M0 64.596L14.819 64.596 14.819 67.085 0 67.085ZM97.781 64.596L128 64.596 128 67.085 97.781 67.085Z',
    ],
    [
      'upper-green-handoff',
      'M0 74.552L14.819 74.552 14.819 79.53 0 79.53ZM87.826 69.574L92.804 69.574C92.804 72.323 95.032 74.552 97.781 74.552L128 74.552 128 79.53 97.781 79.53C95.032 79.53 92.804 81.758 92.804 84.507L92.804 128 87.826 128Z',
    ],
    [
      'upper-south-plane-light',
      'M14.819 64.596L88.656 64.596C77.66 64.596 68.744 73.511 68.744 84.507L68.744 128 14.819 128Z',
    ],
    [
      'upper-south-arris-lip',
      'M88.656 64.596L91.144 64.596C80.149 64.596 71.233 73.511 71.233 84.507L71.233 128 68.744 128 68.744 84.507C68.744 73.511 77.66 64.596 88.656 64.596Z',
    ],
    [
      'upper-south-face-shade',
      'M91.144 64.596L112.715 64.596C101.719 64.596 92.804 73.511 92.804 84.507L92.804 128 71.233 128 71.233 84.507C71.233 73.511 80.149 64.596 91.144 64.596Z',
    ],
    [
      'upper-arris-seam',
      'M71.233 127L71.233 84.507C71.233 73.511 80.149 64.596 91.144 64.596L111.056 64.596',
    ],
    [
      'upper-band-seam',
      'M0.75 74.552L14.819 74.552M127 74.552L97.781 74.552C92.283 74.552 87.826 79.009 87.826 84.507L87.826 127',
    ],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-cream-bridge',
  'upper-north-solid-top',
  'upper-secondary-cream',
] as const;

const FORBIDDEN_BURIED_NORTH_FACE_IDS = [
  'base-contour-open-north',
  'base-green-open-north',
  'base-face-shade-open-north',
  'upper-north-interior-riser',
  'upper-center-seam',
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
  source: A1bDoubleFilledNorthCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (/<(?:use|image)\b/i.test(content) || /\b(?:href|xlink:href)\s*=/.test(content)) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const requiredIds = REQUIRED_SOURCE_IDS[source.id];
  const missing = requiredIds.filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const unexpected = ids.filter((id) => !requiredIds.includes(id));
  if (unexpected.length > 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} contains unexpected semantic ids ${unexpected.join(', ')}`,
    );
  }
  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateCreamOwners.length > 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const buriedFaceIds = FORBIDDEN_BURIED_NORTH_FACE_IDS
    .filter((id) => ids.includes(id));
  if (buriedFaceIds.length > 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} reintroduces buried north fascia through ${buriedFaceIds.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must retain exact double-filled north geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked)/i.test(content)) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external review inventory in stable order. */
export async function compileA1bDoubleFilledNorthCrossJunctionProposalDirectory(
  options: CompileA1bDoubleFilledNorthCrossJunctionProposalOptions,
): Promise<CompiledA1bDoubleFilledNorthCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bDoubleFilledNorthCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bDoubleFilledNorthCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
