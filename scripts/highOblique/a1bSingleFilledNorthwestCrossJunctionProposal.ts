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
    ['base-buried-nw-underlay', 'M116.5 0L0 0 0 76.211 116.5 76.211Z'],
    ['base-contour', 'M38.515 0L10.307 0 10.307 76.211 0 76.211 0 117.693 10.307 117.693 10.307 128 38.515 128 38.515 117.693 128 117.693 128 76.211 38.515 76.211Z'],
  ],
  'open_cross_filled_nw-upper': [
    [
      'upper-contour',
      'M116.5 0L0 0 0 79.53 18.604 79.53C27.768 79.53 35.196 86.958 35.196 96.122L35.196 128 116.5 128 116.5 96.122C116.5 86.958 117.419 79.53 118.554 79.53L128 79.53 128 11.5 118.554 11.5C117.419 11.5 116.5 10.581 116.5 9.446Z',
    ],
    [
      'upper-shell',
      'M113.181 0L0 0 0 76.211 21.922 76.211C31.086 76.211 38.515 83.64 38.515 92.804L38.515 128 113.181 128 113.181 92.804C113.181 83.64 117.009 76.211 118.143 76.211L128 76.211 128 14.819 118.143 14.819C117.009 14.819 113.181 10.991 113.181 9.857Z',
    ],
    [
      'upper-south-plane-light',
      'M113.181 64.596L39.344 64.596C50.34 64.596 59.256 73.511 59.256 84.507L59.256 128 113.181 128Z',
    ],
    [
      'upper-south-arris-lip',
      'M39.344 64.596L36.856 64.596C47.851 64.596 56.767 73.511 56.767 84.507L56.767 128 59.256 128 59.256 84.507C59.256 73.511 50.34 64.596 39.344 64.596Z',
    ],
    [
      'upper-south-face-shade',
      'M36.856 64.596L15.285 64.596C26.281 64.596 35.196 73.511 35.196 84.507L35.196 128 56.767 128 56.767 84.507C56.767 73.511 47.851 64.596 36.856 64.596Z',
    ],
    [
      'upper-arris-seam',
      'M127.25 23.115L118.554 23.115C117.193 23.115 113.181 14.2 113.181 10.473L113.181 0.75M56.767 127L56.767 84.507C56.767 73.511 47.851 64.596 36.856 64.596L16.944 64.596',
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
