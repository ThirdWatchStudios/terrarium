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
    ['base-buried-se-underlay', 'M56 56H128V128H56Z'],
  ],
  'open_cross_filled_se-upper': [
    [
      'upper-contour',
      'M56 0H105V46A10 10 0 0 0 115 56H128V128H56V107A10 10 0 0 0 46 97H0V56H46A10 10 0 0 0 56 46Z',
    ],
    [
      'upper-shell',
      'M58 0H103V48A10 10 0 0 0 113 58H128V128H58V105A10 10 0 0 0 48 95H0V58H48A10 10 0 0 0 58 48Z',
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
