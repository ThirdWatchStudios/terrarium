import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted proof-layer mask_33 source pair.
 *
 * Acceptance is recorded by the proof gate and ledger. This compiler only
 * validates the external flattened pair; it does not mutate the ledger,
 * register production frames, or write files.
 */

export const A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_ne_se_sw-base',
  'open_cross_filled_ne_se_sw-upper',
] as const;

export type A1bSingleOpenNorthwestCrossJunctionProposalSourceId =
  (typeof A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec {
  readonly id: A1bSingleOpenNorthwestCrossJunctionProposalSourceId;
  readonly filename:
    `${A1bSingleOpenNorthwestCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 33;
  readonly boundaryRole: 'single-open-northwest-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bSingleOpenNorthwestCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 33,
  boundaryRole: 'single-open-northwest-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_ne_se_sw-base', 'base'),
  sourceSpec('open_cross_filled_ne_se_sw-upper', 'upper'),
];

export interface CompiledA1bSingleOpenNorthwestCrossJunctionProposalSource
  extends A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bSingleOpenNorthwestCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bSingleOpenNorthwestCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(
      `A1b single-open northwest cross-junction proof-source import: ${message}`,
    );
    this.name =
      'A1bSingleOpenNorthwestCrossJunctionProposalImportError';
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
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

const APPROVED_PAINTS = new Set<string>([
  A1A_PALETTE.charcoal,
  A1A_PALETTE.cream,
  '#FFFFFF',
]);

const REQUIRED_SOURCE_IDS: Readonly<
Record<
  A1bSingleOpenNorthwestCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_ne_se_sw-base': [
    'detail/base',
    'base-structural-mass',
  ],
  'open_cross_filled_ne_se_sw-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-nw-reveal-light',
    'upper-arris-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bSingleOpenNorthwestCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_ne_se_sw-base': [
    [
      'base-structural-mass',
      'M11.5 0L128 0 128 128 0 128 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
  ],
  'open_cross_filled_ne_se_sw-upper': [
    [
      'upper-contour',
      'M11.5 0L128 0 128 128 0 128 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'upper-shell',
      'M14.819 0L128 0 128 128 0 128 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
    ],
    [
      'upper-nw-reveal-light',
      'M0 14.819L9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857L14.819 9.036C14.819 10.397 10.807 11.5 9.446 11.5L0 11.5Z',
    ],
    [
      'upper-arris-seam',
      'M0.75 11.5L9.446 11.5C10.807 11.5 14.819 10.397 14.819 9.036L14.819 0.75',
    ],
  ],
};

const EXACT_PRESENTATION: Readonly<
Partial<
Record<
  A1bSingleOpenNorthwestCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
>
> = {
  'open_cross_filled_ne_se_sw-upper': [
    [
      'upper-nw-reveal-light',
      '<path id="upper-nw-reveal-light" d="M0 14.819L9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857L14.819 9.036C14.819 10.397 10.807 11.5 9.446 11.5L0 11.5Z" fill="#FFFFFF" opacity="0.30"/>',
    ],
    [
      'upper-arris-seam',
      '<path id="upper-arris-seam" d="M0.75 11.5L9.446 11.5C10.807 11.5 14.819 10.397 14.819 9.036L14.819 0.75" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>',
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
  source: A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec,
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
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
        `${sourceFile} contains anonymous drawable <${tag}>`,
      );
    }
    const expectedTag = expected.get(id);
    if (!expectedTag || tag !== expectedTag) {
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
        `${sourceFile} contains out-of-inventory drawable ${id} as <${tag}>`,
      );
    }
    actual.push(id);
  }
  const expectedIds = [...expected.keys()];
  if (JSON.stringify(actual) !== JSON.stringify(expectedIds)) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
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
  source: A1bSingleOpenNorthwestCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    /<(?:use|image)\b/i.test(content) ||
    /\b(?:href|xlink:href)\s*=/.test(content)
  ) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const requiredIds = REQUIRED_SOURCE_IDS[source.id];
  const missing = requiredIds.filter((id) => !ids.includes(id));
  const unexpected = ids.filter((id) => !requiredIds.includes(id));
  if (missing.length > 0) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (unexpected.length > 0) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} contains unexpected semantic ids ${unexpected.join(', ')}`,
    );
  }

  validateDrawableInventory(source, sourceFile, content);

  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must retain exact single-open northwest geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    /\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|bridge|secondary-cream|center-seam)/i
      .test(content)
  ) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, overlay, stack, center seam, or duplicate cream owner`,
    );
  }

  if (source.layer === 'upper') {
    if (
      JSON.stringify(pathOwnersForPaint(content, A1A_PALETTE.cream)) !==
      JSON.stringify(['upper-shell'])
    ) {
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
        `${sourceFile} must keep upper-shell as the sole cream path owner`,
      );
    }
  }
  if (
    pathOwnersForPaint(content, A1A_PALETTE.coral).length > 0 ||
    pathOwnersForPaint(content, A1A_PALETTE.green).length > 0
  ) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must not repaint coral or green on buried frontage`,
    );
  }
  const alteredPresentation = (EXACT_PRESENTATION[source.id] ?? [])
    .filter(([, markup]) => !content.includes(markup))
    .map(([id]) => id);
  if (alteredPresentation.length > 0) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} must retain exact fixed-light presentation for ${alteredPresentation.join(', ')}`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
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
        throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external accepted inventory in stable order. */
export async function
compileA1bSingleOpenNorthwestCrossJunctionProposalDirectory(
  options: CompileA1bSingleOpenNorthwestCrossJunctionProposalOptions,
): Promise<CompiledA1bSingleOpenNorthwestCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
      .map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bSingleOpenNorthwestCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled:
    CompiledA1bSingleOpenNorthwestCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
