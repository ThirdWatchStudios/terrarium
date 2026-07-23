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
    'upper-coral-band',
    'upper-band-light',
    'upper-green-handoff',
    'upper-south-plane-light',
    'upper-south-arris-lip',
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
    ['base-buried-north-underlay', 'M0 0H128V95H0Z'],
    [
      'base-contour-exposed-south',
      'M103 95H128V120H120V128H103V120H0V95Z',
    ],
    [
      'base-green-exposed-south',
      'M105 94A3 3 0 0 0 108 97H128V117H120A3 3 0 0 0 117 120V128H105V120A3 3 0 0 0 102 117H0V97H102A3 3 0 0 0 105 94Z',
    ],
  ],
  'open_cross_filled_n-upper': [
    [
      'upper-contour',
      'M0 0H128V97H115A10 10 0 0 0 105 107V128H56V107A10 10 0 0 0 46 97H0Z',
    ],
    [
      'upper-shell',
      'M0 0H128V95H113A10 10 0 0 0 103 105V128H58V105A10 10 0 0 0 48 95H0Z',
    ],
    [
      'upper-horizontal-face-shade',
      'M0 63H58V88H0Z M105 63H128V88H105Z',
    ],
    [
      'upper-coral-band',
      'M0 88H58V94H0Z M97 128V94H128V88H108A6 6 0 0 0 102 94V128Z',
    ],
    [
      'upper-band-light',
      'M0 88H58V89.5H0Z M108 88H128V89.5H108Z',
    ],
    [
      'upper-green-handoff',
      'M0 94H58V97H0Z M102 91H105A3 3 0 0 0 108 94H128V97H108A3 3 0 0 0 105 100V128H102Z',
    ],
    [
      'upper-south-plane-light',
      'M58 88H90.5V128H58Z',
    ],
    [
      'upper-south-arris-lip',
      'M90.5 88H92V128H90.5Z',
    ],
    [
      'upper-south-face-shade',
      'M92 88H105V128H92Z',
    ],
    [
      'upper-arris-seam',
      'M92 88V127',
    ],
    [
      'upper-band-seam',
      'M1 94H58 M127 94H108A6 6 0 0 0 102 100V127',
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
