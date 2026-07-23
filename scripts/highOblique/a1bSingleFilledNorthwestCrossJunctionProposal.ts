import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the accepted proof-layer mask_37 northwest-filled source pair. */

export const A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_nw-base',
  'open_cross_filled_nw-upper',
] as const;

export type A1bSingleFilledNorthwestCrossJunctionProposalSourceId =
  (typeof A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bSingleFilledNorthwestCrossJunctionProposalSourceSpec {
  readonly id: A1bSingleFilledNorthwestCrossJunctionProposalSourceId;
  readonly filename: `${A1bSingleFilledNorthwestCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 37;
  readonly boundaryRole: 'northwest-filled-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bSingleFilledNorthwestCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bSingleFilledNorthwestCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 37,
  boundaryRole: 'northwest-filled-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bSingleFilledNorthwestCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_nw-base', 'base'),
  sourceSpec('open_cross_filled_nw-upper', 'upper'),
];

export interface CompiledA1bSingleFilledNorthwestCrossJunctionProposalSource
  extends A1bSingleFilledNorthwestCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bSingleFilledNorthwestCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bSingleFilledNorthwestCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(`A1b single-filled northwest cross-junction proof-source import: ${message}`);
    this.name = 'A1bSingleFilledNorthwestCrossJunctionProposalImportError';
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
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
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
  A1bSingleFilledNorthwestCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_nw-base': [
    'detail/base',
    'base-buried-nw-underlay',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_cross_filled_nw-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-green-handoff',
    'upper-coral-band',
    'upper-band-light',
    'upper-north-face-shade',
    'upper-reveal-light',
    'upper-south-plane-light',
    'upper-south-arris-lip',
    'upper-south-coral-band',
    'upper-south-green-handoff',
    'upper-south-face-shade',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
    'upper-south-service-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bSingleFilledNorthwestCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_nw-base': [
    ['base-buried-nw-underlay', 'M72 0H0V95H72Z'],
    ['base-contour', 'M25 0H8V95H0V120H8V128H25V120H128V95H25Z'],
  ],
  'open_cross_filled_nw-upper': [
    [
      'upper-contour',
      'M72 0H0V97H13A10 10 0 0 1 23 107V128H72V107A10 10 0 0 1 82 97H128V56H82A10 10 0 0 1 72 46Z',
    ],
    [
      'upper-shell',
      'M70 0H0V95H15A10 10 0 0 1 25 105V128H70V105A10 10 0 0 1 80 95H128V58H80A10 10 0 0 1 70 48Z',
    ],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-nw-solid-top',
  'upper-cream-bridge',
] as const;

const FORBIDDEN_INTERIOR_RISER_IDS = [
  'upper-north-plane-light',
  'upper-north-arris-lip',
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
  source: A1bSingleFilledNorthwestCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    /<(?:use|image)\b/i.test(content) ||
    /\b(?:href|xlink:href)\s*=/.test(content)
  ) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter(
    (id) => !ids.includes(id),
  );
  if (missing.length > 0) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS.filter(
    (id) => ids.includes(id),
  );
  if (duplicateCreamOwners.length > 0) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const interiorRiserIds = FORBIDDEN_INTERIOR_RISER_IDS.filter(
    (id) => ids.includes(id),
  );
  if (interiorRiserIds.length > 0) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} reintroduces a buried interior riser through ${interiorRiserIds.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must retain exact native east-register geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (
    /\bid=["'][^"']*(?:cap|post|pylon|rollover|overlay|patch|stacked)/i.test(
      content,
    )
  ) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (
        paint !== undefined &&
        paint !== 'none' &&
        !APPROVED_PAINTS.has(paint)
      ) {
        throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file accepted proof inventory in stable order. */
export async function compileA1bSingleFilledNorthwestCrossJunctionProposalDirectory(
  options: CompileA1bSingleFilledNorthwestCrossJunctionProposalOptions,
): Promise<CompiledA1bSingleFilledNorthwestCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bSingleFilledNorthwestCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled:
  CompiledA1bSingleFilledNorthwestCrossJunctionProposalSource[] = [];
  for (
    const source
    of A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
