import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/**
 * Strict compiler for the owner-accepted proof-layer mask_32 source pair.
 *
 * This module validates an external proof bank. It does not accept the source,
 * mutate the equal-height ledger, register production frames, or write files.
 */

export const A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_s-base',
  'open_cross_filled_s-upper',
] as const;

export type A1bDoubleFilledSouthCrossJunctionProposalSourceId =
  (typeof A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bDoubleFilledSouthCrossJunctionProposalSourceSpec {
  readonly id: A1bDoubleFilledSouthCrossJunctionProposalSourceId;
  readonly filename:
    `${A1bDoubleFilledSouthCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 32;
  readonly boundaryRole: 'double-filled-south-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bDoubleFilledSouthCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bDoubleFilledSouthCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 32,
  boundaryRole: 'double-filled-south-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bDoubleFilledSouthCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_s-base', 'base'),
  sourceSpec('open_cross_filled_s-upper', 'upper'),
];

export interface CompiledA1bDoubleFilledSouthCrossJunctionProposalSource
  extends A1bDoubleFilledSouthCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bDoubleFilledSouthCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bDoubleFilledSouthCrossJunctionProposalImportError
  extends Error {
  constructor(message: string) {
    super(
      `A1b double-filled south cross-junction proof-source import: ${message}`,
    );
    this.name = 'A1bDoubleFilledSouthCrossJunctionProposalImportError';
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
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
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
  A1bDoubleFilledSouthCrossJunctionProposalSourceId,
  readonly string[]
>
> = {
  'open_cross_filled_s-base': [
    'detail/base',
    'base-buried-south-underlay',
    'base-contour-open-north',
    'base-green-open-north',
    'base-face-shade-open-north',
    'base-contact-shade-open-north',
  ],
  'open_cross_filled_s-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-north-plane-light',
    'upper-north-arris-lip',
    'upper-north-face-shade',
    'upper-north-coral-register',
    'upper-north-green-handoff',
    'upper-slab-reveal-light',
    'upper-arris-seam',
    'upper-register-seam',
  ],
};

const EXACT_PATHS: Readonly<
Record<
  A1bDoubleFilledSouthCrossJunctionProposalSourceId,
  readonly (readonly [string, string])[]
>
> = {
  'open_cross_filled_s-base': [
    ['base-buried-south-underlay', 'M0 56H128V128H0Z'],
    ['base-contour-open-north', 'M103 0H120V56H103Z'],
    ['base-green-open-north', 'M105 0H117V56H105Z'],
    ['base-face-shade-open-north', 'M105 0H117V56H105Z'],
    ['base-contact-shade-open-north', 'M120 0H123.5V56H120Z'],
  ],
  'open_cross_filled_s-upper': [
    [
      'upper-contour',
      'M56 0H105V44A12 12 0 0 0 117 56H128V128H0V56H46A10 10 0 0 0 56 46Z',
    ],
    [
      'upper-shell',
      'M58 0H103V46A12 12 0 0 0 115 58H128V128H0V58H48A10 10 0 0 0 58 48Z',
    ],
    [
      'upper-north-plane-light',
      'M58 0H90.5V44A12 12 0 0 0 102.5 56H58Z',
    ],
    [
      'upper-north-arris-lip',
      'M90.5 0H92V44A12 12 0 0 0 104 56H102.5A12 12 0 0 1 90.5 44Z',
    ],
    [
      'upper-north-face-shade',
      'M92 0H105V44A12 12 0 0 0 117 56H104A12 12 0 0 1 92 44Z',
    ],
    [
      'upper-north-coral-register',
      'M97 0H102V44A12 12 0 0 0 114 56H109A12 12 0 0 1 97 44Z',
    ],
    [
      'upper-north-green-handoff',
      'M102 0H105V44A12 12 0 0 0 117 56H114A12 12 0 0 1 102 44Z',
    ],
    ['upper-slab-reveal-light', 'M0 58H128V63H0Z'],
    [
      'upper-arris-seam',
      'M92 1V44A12 12 0 0 0 104 56H116 M1 63H127',
    ],
    [
      'upper-register-seam',
      'M102 1V44A12 12 0 0 0 114 56',
    ],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-cream-bridge',
  'upper-south-solid-top',
  'upper-secondary-cream',
] as const;

const FORBIDDEN_BURIED_HORIZONTAL_FASCIA_IDS = [
  'base-contour-exposed-south',
  'base-green-exposed-south',
  'base-face-shade-exposed-south',
  'base-contact-shade-exposed-south',
  'upper-horizontal-face-shade',
  'upper-coral-band',
  'upper-band-light',
  'upper-green-handoff',
  'upper-south-face-shade',
  'upper-south-coral-wrap',
  'upper-south-green-wrap',
  'upper-south-plinth',
] as const;

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)]
    .map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

const creamPathOwners = (content: string): readonly string[] =>
  [...content.matchAll(
    /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
  )].map((match) => match[1]);

const paintPathOwners = (
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
  source: A1bDoubleFilledSouthCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (
    /<(?:use|image)\b/i.test(content) ||
    /\b(?:href|xlink:href)\s*=/.test(content)
  ) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const requiredIds = REQUIRED_SOURCE_IDS[source.id];
  const missing = requiredIds.filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const unexpected = ids.filter((id) => !requiredIds.includes(id));
  if (unexpected.length > 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} contains unexpected semantic ids ${unexpected.join(', ')}`,
    );
  }

  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateCreamOwners.length > 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const buriedFascia = FORBIDDEN_BURIED_HORIZONTAL_FASCIA_IDS
    .filter((id) => ids.includes(id));
  if (buriedFascia.length > 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} reintroduces buried horizontal fascia through ${buriedFascia.join(', ')}`,
    );
  }

  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must retain exact double-filled south geometry for ${alteredPaths.join(', ')}`,
    );
  }

  if (source.layer === 'upper') {
    if (
      JSON.stringify(creamPathOwners(content)) !==
      JSON.stringify(['upper-shell'])
    ) {
      throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
        `${sourceFile} must keep upper-shell as the sole cream path owner`,
      );
    }
    if (
      JSON.stringify(paintPathOwners(content, '#B65F4D')) !==
        JSON.stringify(['upper-north-coral-register']) ||
      JSON.stringify(paintPathOwners(content, '#294B3C')) !==
        JSON.stringify(['upper-north-green-handoff'])
    ) {
      throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
        `${sourceFile} must keep coral and green on the north-spur side register only`,
      );
    }
  }

  if (
    /\bid=["'][^"']*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked)/i
      .test(content)
  ) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, peak, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
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
        throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external accepted inventory in stable order. */
export async function
compileA1bDoubleFilledSouthCrossJunctionProposalDirectory(
  options: CompileA1bDoubleFilledSouthCrossJunctionProposalOptions,
): Promise<CompiledA1bDoubleFilledSouthCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
      .map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bDoubleFilledSouthCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled:
    CompiledA1bDoubleFilledSouthCrossJunctionProposalSource[] = [];
  for (
    const source of
    A1B_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
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
