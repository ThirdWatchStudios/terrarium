import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted proof-layer mask_41 source pair.
 *
 * Acceptance is recorded by the proof gate and ledger. This compiler only
 * validates the external flattened pair; it does not mutate the ledger,
 * register production frames, or write files.
 */

export const A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_ne_se_nw-base',
  'open_cross_filled_ne_se_nw-upper',
] as const;

export type A1bSingleOpenSouthwestCrossJunctionProposalSourceId =
  (typeof A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec {
  readonly id: A1bSingleOpenSouthwestCrossJunctionProposalSourceId;
  readonly filename:
    `${A1bSingleOpenSouthwestCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 41;
  readonly boundaryRole: 'single-open-southwest-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bSingleOpenSouthwestCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 41,
  boundaryRole: 'single-open-southwest-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_ne_se_nw-base', 'base'),
  sourceSpec('open_cross_filled_ne_se_nw-upper', 'upper'),
];

export interface CompiledA1bSingleOpenSouthwestCrossJunctionProposalSource
  extends A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bSingleOpenSouthwestCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bSingleOpenSouthwestCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(
      `A1b single-open southwest cross-junction proof-source import: ${message}`,
    );
    this.name =
      'A1bSingleOpenSouthwestCrossJunctionProposalImportError';
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
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
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
  A1bSingleOpenSouthwestCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_ne_se_nw-base': [
    'detail/base',
    'base-structural-mass',
    'base-green-sw-return',
    'base-face-shade-sw-return',
    'base-contact-shade-sw-return',
  ],
  'open_cross_filled_ne_se_nw-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-sw-face-shade',
    'upper-coral-sw-return',
    'upper-band-light-sw-return',
    'upper-green-sw-return',
    'upper-band-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bSingleOpenSouthwestCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_ne_se_nw-base': [
    [
      'base-structural-mass',
      'M0 0H128V128H56V107A10 10 0 0 0 46 97H0Z',
    ],
    ['base-green-sw-return', 'M0 97H58V117H0Z'],
    ['base-face-shade-sw-return', 'M46 97H58V128H46Z'],
    ['base-contact-shade-sw-return', 'M0 120H58V123.5H0Z'],
  ],
  'open_cross_filled_ne_se_nw-upper': [
    [
      'upper-contour',
      'M0 0H128V128H56V107A10 10 0 0 0 46 97H0Z',
    ],
    [
      'upper-shell',
      'M0 0H128V128H58V105A10 10 0 0 0 48 95H0Z',
    ],
    ['upper-sw-face-shade', 'M0 63H48V88H0Z'],
    [
      'upper-coral-sw-return',
      'M0 88H48A10 10 0 0 1 58 98V128H52V98A4 4 0 0 0 48 94H0Z',
    ],
    ['upper-band-light-sw-return', 'M0 88H48V89.5H0Z'],
    [
      'upper-green-sw-return',
      'M0 94H46A12 12 0 0 1 58 106V128H55V106A9 9 0 0 0 46 97H0Z',
    ],
    [
      'upper-band-seam',
      'M1 94H46A12 12 0 0 1 58 106V127',
    ],
  ],
};

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)]
    .map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

const DRAWABLE_TAG_PATTERN =
  /<(path|rect|circle|ellipse|line|polyline|polygon|text|use|image|foreignObject)\b([^>]*)>/gi;

function validateDrawableInventory(
  source: A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): void {
  const expected = new Map(
    EXACT_PATHS[source.id].map(([id]) => [id, 'path'] as const),
  );
  const actual: string[] = [];
  for (const match of content.matchAll(DRAWABLE_TAG_PATTERN)) {
    const tag = match[1];
    const attributes = match[2];
    const id = /\bid=["']([^"']+)["']/.exec(attributes)?.[1];
    if (!id) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `${sourceFile} contains anonymous drawable <${tag}>`,
      );
    }
    const expectedTag = expected.get(id);
    if (!expectedTag || tag !== expectedTag) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `${sourceFile} contains out-of-inventory drawable ${id} as <${tag}>`,
      );
    }
    actual.push(id);
  }
  const expectedIds = [...expected.keys()];
  if (JSON.stringify(actual) !== JSON.stringify(expectedIds)) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} drawable inventory must be exactly ${expectedIds.join(', ')}`,
    );
  }
}

const pathOwnersForPaint = (
  content: string,
  paint: string,
): readonly string[] =>
  [...content.matchAll(
    new RegExp(
      `<path\\b(?=[^>]*\\bid=["']([^"']+)["'])(?=[^>]*\\bfill=["']${paint}["'])[^>]*>`,
      'gi',
    ),
  )].map((match) => match[1]);

function validateSource(
  source: A1bSingleOpenSouthwestCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    /<(?:use|image)\b/i.test(content) ||
    /\b(?:href|xlink:href)\s*=/.test(content)
  ) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const requiredIds = REQUIRED_SOURCE_IDS[source.id];
  const missing = requiredIds.filter((id) => !ids.includes(id));
  const unexpected = ids.filter((id) => !requiredIds.includes(id));
  if (missing.length > 0) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (unexpected.length > 0) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} contains unexpected semantic ids ${unexpected.join(', ')}`,
    );
  }

  validateDrawableInventory(source, sourceFile, content);

  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must retain exact single-open southwest geometry for ${alteredPaths.join(', ')}`,
    );
  }

  if (
    /\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|bridge|secondary-cream)/i
      .test(content)
  ) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, overlay, stack, or duplicate cream owner`,
    );
  }

  if (source.layer === 'upper') {
    if (
      JSON.stringify(pathOwnersForPaint(content, A1A_PALETTE.cream)) !==
      JSON.stringify(['upper-shell'])
    ) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `${sourceFile} must keep upper-shell as the sole cream path owner`,
      );
    }
    if (
      JSON.stringify(pathOwnersForPaint(content, A1A_PALETTE.coral)) !==
        JSON.stringify(['upper-coral-sw-return']) ||
      JSON.stringify(pathOwnersForPaint(content, A1A_PALETTE.green)) !==
        JSON.stringify(['upper-green-sw-return'])
    ) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `${sourceFile} must keep coral and green on the southwest return only`,
      );
    }
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
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
        throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external accepted inventory in stable order. */
export async function
compileA1bSingleOpenSouthwestCrossJunctionProposalDirectory(
  options: CompileA1bSingleOpenSouthwestCrossJunctionProposalOptions,
): Promise<CompiledA1bSingleOpenSouthwestCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
      .map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bSingleOpenSouthwestCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled:
    CompiledA1bSingleOpenSouthwestCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
