import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the owner-accepted mask_30 proof-layer source pair. */

export const A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_ne_sw-base',
  'open_cross_filled_ne_sw-upper',
] as const;

export type A1bDoubleFilledDiagonalCrossJunctionProposalSourceId =
  (typeof A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bDoubleFilledDiagonalCrossJunctionProposalSourceSpec {
  readonly id: A1bDoubleFilledDiagonalCrossJunctionProposalSourceId;
  readonly filename: `${A1bDoubleFilledDiagonalCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 30;
  readonly boundaryRole: 'double-filled-diagonal-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bDoubleFilledDiagonalCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bDoubleFilledDiagonalCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 30,
  boundaryRole: 'double-filled-diagonal-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bDoubleFilledDiagonalCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_ne_sw-base', 'base'),
  sourceSpec('open_cross_filled_ne_sw-upper', 'upper'),
];

export interface CompiledA1bDoubleFilledDiagonalCrossJunctionProposalSource
  extends A1bDoubleFilledDiagonalCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bDoubleFilledDiagonalCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bDoubleFilledDiagonalCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(`A1b double-filled diagonal cross-junction proof-source import: ${message}`);
    this.name = 'A1bDoubleFilledDiagonalCrossJunctionProposalImportError';
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
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
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
  A1bDoubleFilledDiagonalCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_ne_sw-base': [
    'detail/base',
    'base-structural-mass',
    'base-green-se-return',
    'base-face-shade-se-return',
    'base-contact-shade-se-return',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_cross_filled_ne_sw-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-nw-reveal-light',
    'upper-se-face-shade',
    'upper-coral-se-return',
    'upper-band-light-se-return',
    'upper-green-se-return',
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
  A1bDoubleFilledDiagonalCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_ne_sw-base': [
    [
      'base-structural-mass',
      'M11.5 0L128 0 128 79.53 118.554 79.53C117.419 79.53 116.5 86.958 116.5 96.122L116.5 128 0 128 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'base-green-se-return',
      'M70 79.53L128 79.53 128 112.715 70 112.715Z',
    ],
    ['base-face-shade-se-return', 'M70 79.53L82 79.53 82 112.715 70 112.715Z'],
    [
      'base-contact-shade-se-return',
      'M70 117.693L128 117.693 128 123.5 70 123.5Z',
    ],
    ['base-boundary-seam', 'M126 81.189L126 111.056'],
    ['base-south-service-seam', 'M16.944 126L33.537 126'],
  ],
  'open_cross_filled_ne_sw-upper': [
    [
      'upper-contour',
      'M11.5 0L128 0 128 79.53 118.554 79.53C117.419 79.53 116.5 86.958 116.5 96.122L116.5 128 0 128 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'upper-shell',
      'M14.819 0L128 0 128 76.211 118.143 76.211C117.009 76.211 113.181 83.64 113.181 92.804L113.181 128 0 128 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
    ],
    [
      'upper-nw-reveal-light',
      'M0 14.819L9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857L14.819 9.036C14.819 10.397 10.807 11.5 9.446 11.5L0 11.5Z',
    ],
    ['upper-se-face-shade', 'M70 23.115L128 23.115 128 64.596 70 64.596Z'],
    [
      'upper-coral-se-return',
      'M70 64.596L128 64.596 128 74.552 70 74.552Z',
    ],
    ['upper-band-light-se-return', 'M70 64.596L128 64.596 128 67.085 70 67.085Z'],
    [
      'upper-green-se-return',
      'M70 74.552L128 74.552 128 79.53 70 79.53Z',
    ],
    ['upper-south-plane-light', 'M59.256 105L113.181 105 113.181 126 59.256 126Z'],
    ['upper-south-arris-lip', 'M56.767 105L59.256 105 59.256 126 56.767 126Z'],
    ['upper-south-face-shade', 'M35.196 105L56.767 105 56.767 126 35.196 126Z'],
    [
      'upper-arris-seam',
      'M0.75 11.5L9.446 11.5C10.807 11.5 14.819 10.397 14.819 9.036L14.819 0.75M56.767 106L56.767 125',
    ],
    [
      'upper-band-seam',
      'M127 74.552L70 74.552',
    ],
    ['upper-boundary-seam', 'M126 24.774L126 77.87'],
    ['upper-south-service-seam', 'M36.856 126L111.522 126'],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-cream-bridge',
  'upper-secondary-cream',
  'upper-solid-ne',
  'upper-solid-sw',
] as const;

const FORBIDDEN_BURIED_FACE_IDS = [
  'base-green-ne',
  'base-green-sw',
  'upper-coral-ne',
  'upper-coral-sw',
  'upper-green-ne',
  'upper-green-sw',
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
  source: A1bDoubleFilledDiagonalCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    /<(?:use|image)\b/i.test(content) ||
    /\b(?:href|xlink:href)\s*=/.test(content)
  ) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const requiredIds = REQUIRED_SOURCE_IDS[source.id];
  const missing = requiredIds.filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const unexpected = ids.filter((id) => !requiredIds.includes(id));
  if (unexpected.length > 0) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} contains unexpected semantic ids ${unexpected.join(', ')}`,
    );
  }
  const forbiddenIds = [
    ...FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS,
    ...FORBIDDEN_BURIED_FACE_IDS,
  ].filter((id) => ids.includes(id));
  if (forbiddenIds.length > 0) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} reintroduces forbidden source ownership through ${forbiddenIds.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must retain exact double-filled diagonal geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (
    /\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|center-seam)/i
      .test(content)
  ) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, pylon, rollover, overlay, patch, stacked source, or center seam`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
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
        throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external accepted inventory in stable order. */
export async function compileA1bDoubleFilledDiagonalCrossJunctionProposalDirectory(
  options: CompileA1bDoubleFilledDiagonalCrossJunctionProposalOptions,
): Promise<CompiledA1bDoubleFilledDiagonalCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bDoubleFilledDiagonalCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled:
  CompiledA1bDoubleFilledDiagonalCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
