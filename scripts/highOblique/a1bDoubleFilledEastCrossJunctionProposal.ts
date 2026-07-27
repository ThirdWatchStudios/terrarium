import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the accepted proof-layer mask_25 double-filled east source pair. */

export const A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_e-base',
  'open_cross_filled_e-upper',
] as const;

export type A1bDoubleFilledEastCrossJunctionProposalSourceId =
  (typeof A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bDoubleFilledEastCrossJunctionProposalSourceSpec {
  readonly id: A1bDoubleFilledEastCrossJunctionProposalSourceId;
  readonly filename: `${A1bDoubleFilledEastCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 25;
  readonly boundaryRole: 'double-filled-east-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bDoubleFilledEastCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bDoubleFilledEastCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 25,
  boundaryRole: 'double-filled-east-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bDoubleFilledEastCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_e-base', 'base'),
  sourceSpec('open_cross_filled_e-upper', 'upper'),
];

export interface CompiledA1bDoubleFilledEastCrossJunctionProposalSource
  extends A1bDoubleFilledEastCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bDoubleFilledEastCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bDoubleFilledEastCrossJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b double-filled east cross-junction proof-source import: ${message}`);
    this.name = 'A1bDoubleFilledEastCrossJunctionProposalImportError';
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
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
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
Record<A1bDoubleFilledEastCrossJunctionProposalSourceId, readonly string[]>
> = {
  'open_cross_filled_e-base': [
    'detail/base',
    'base-buried-east-underlay',
    'base-contour-open-sw',
    'base-green-open-sw',
    'base-face-shade-open-sw',
    'base-contact-shade-open-sw',
  ],
  'open_cross_filled_e-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-reveal-light-open-nw',
    'upper-arris-seam-open-nw',
    'upper-solid-top-highlight',
    'upper-coral-open-sw',
    'upper-band-light-open-sw',
    'upper-green-open-sw',
    'upper-face-shade-open-sw',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bDoubleFilledEastCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_e-base': [
    ['base-buried-east-underlay', 'M11.5 0L128 0 128 128 11.5 128Z'],
    ['base-contour-open-sw', 'M0 76.211L14.819 76.211 14.819 117.693 0 117.693Z'],
    ['base-green-open-sw', 'M0 79.53L14.819 79.53 14.819 112.715 0 112.715Z'],
  ],
  'open_cross_filled_e-upper': [
    [
      'upper-contour',
      'M11.5 0L128 0 128 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'upper-shell',
      'M14.819 0L128 0 128 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
    ],
    [
      'upper-reveal-light-open-nw',
      'M0 14.819L9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857L14.819 9.036C14.819 10.397 10.807 11.5 9.446 11.5L0 11.5Z',
    ],
    [
      'upper-arris-seam-open-nw',
      'M0.75 11.5L9.446 11.5C10.807 11.5 14.819 10.397 14.819 9.036L14.819 0.75',
    ],
    ['upper-solid-top-highlight', 'M14.819 14.819L117.693 14.819 117.693 23.115 14.819 23.115Z'],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-east-solid-top',
  'upper-cream-bridge',
  'upper-secondary-cream',
] as const;

const FORBIDDEN_BURIED_FACE_IDS = [
  'base-contour-open-ne',
  'base-green-open-ne',
  'base-face-shade-open-ne',
  'upper-coral-open-ne',
  'upper-green-open-ne',
  'upper-face-shade-open-ne',
  'upper-coral-filled-east',
  'upper-green-filled-east',
  'upper-east-interior-riser',
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
  source: A1bDoubleFilledEastCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (/<(?:use|image)\b/i.test(content) || /\b(?:href|xlink:href)\s*=/.test(content)) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateCreamOwners.length > 0) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const buriedFaceIds = FORBIDDEN_BURIED_FACE_IDS.filter((id) => ids.includes(id));
  if (buriedFaceIds.length > 0) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} reintroduces buried east face geometry through ${buriedFaceIds.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must retain exact double-filled east geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked)/i.test(content)) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external review inventory in stable order. */
export async function compileA1bDoubleFilledEastCrossJunctionProposalDirectory(
  options: CompileA1bDoubleFilledEastCrossJunctionProposalOptions,
): Promise<CompiledA1bDoubleFilledEastCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bDoubleFilledEastCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bDoubleFilledEastCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
