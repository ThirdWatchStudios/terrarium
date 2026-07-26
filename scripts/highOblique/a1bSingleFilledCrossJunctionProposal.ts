import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only mask_19 northeast-filled four-way source pair. */

export const A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_filled_ne-base',
  'open_cross_filled_ne-upper',
] as const;

export type A1bSingleFilledCrossJunctionProposalSourceId =
  (typeof A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bSingleFilledCrossJunctionProposalSourceSpec {
  readonly id: A1bSingleFilledCrossJunctionProposalSourceId;
  readonly filename: `${A1bSingleFilledCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 19;
  readonly boundaryRole: 'northeast-filled-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bSingleFilledCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bSingleFilledCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 19,
  boundaryRole: 'northeast-filled-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bSingleFilledCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_filled_ne-base', 'base'),
  sourceSpec('open_cross_filled_ne-upper', 'upper'),
];

export interface CompiledA1bSingleFilledCrossJunctionProposalSource
  extends A1bSingleFilledCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bSingleFilledCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bSingleFilledCrossJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b single-filled cross-junction proof-source import: ${message}`);
    this.name = 'A1bSingleFilledCrossJunctionProposalImportError';
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
    throw new A1bSingleFilledCrossJunctionProposalImportError(
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
Record<A1bSingleFilledCrossJunctionProposalSourceId, readonly string[]>
> = {
  'open_cross_filled_ne-base': [
    'detail/base',
    'base-buried-ne-underlay',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_cross_filled_ne-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-reveal-light',
    'upper-north-face-shade',
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
Record<A1bSingleFilledCrossJunctionProposalSourceId, readonly (readonly [string, string])[]>
> = {
  'open_cross_filled_ne-base': [],
  'open_cross_filled_ne-upper': [
    [
      'upper-contour',
      'M56 0H128V97H115A10 10 0 0 0 105 107V128H56V107A10 10 0 0 0 46 97H0V56H46A10 10 0 0 0 56 46Z',
    ],
    [
      'upper-shell',
      'M58 0H128V95H113A10 10 0 0 0 103 105V128H58V105A10 10 0 0 0 48 95H0V58H48A10 10 0 0 0 58 48Z',
    ],
    [
      'upper-reveal-light',
      'M0 58H48A10 10 0 0 0 58 48V44A12 12 0 0 1 46 56H0Z',
    ],
    [
      'upper-south-plane-light',
      'M58 88H102.5A12 12 0 0 0 90.5 100V128H58Z',
    ],
    [
      'upper-south-arris-lip',
      'M102.5 88H104A12 12 0 0 0 92 100V128H90.5V100A12 12 0 0 1 102.5 88Z',
    ],
    [
      'upper-coral-band',
      'M0 88H58V94H0Z M97 128V94H128V88H108A6 6 0 0 0 102 94V128Z',
    ],
    [
      'upper-green-handoff',
      'M0 94H58V97H0Z M102 91H105A3 3 0 0 0 108 94H128V97H108A3 3 0 0 0 105 100V128H102Z',
    ],
    [
      'upper-south-face-shade',
      'M104 88H117A12 12 0 0 0 105 100V128H92V100A12 12 0 0 1 104 88Z',
    ],
    [
      'upper-arris-seam',
      'M1 56H46A12 12 0 0 0 58 44V1 M92 127V100A12 12 0 0 1 104 88H116',
    ],
  ],
};

const FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS = [
  'upper-ne-solid-top',
  'upper-cream-bridge',
] as const;

const FORBIDDEN_INTERIOR_RISER_IDS = [
  'upper-north-plane-light',
  'upper-north-arris-lip',
] as const;

const FORBIDDEN_DUPLICATE_BELT_OWNER_IDS = [
  'upper-south-coral-band',
  'upper-south-green-handoff',
] as const;

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

const creamPathOwners = (content: string): readonly string[] =>
  [...content.matchAll(
    /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
  )].map((match) => match[1]);

const paintPathOwners = (
  content: string,
  paint: string,
): readonly string[] => {
  const escapedPaint = paint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...content.matchAll(
    new RegExp(
      `<path\\b(?=[^>]*\\bid=["']([^"']+)["'])(?=[^>]*\\bfill=["']${escapedPaint}["'])[^>]*>`,
      'gi',
    ),
  )].map((match) => match[1]);
};

function validateSource(
  source: A1bSingleFilledCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (/<(?:use|image)\b/i.test(content) || /\b(?:href|xlink:href)\s*=/.test(content)) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const duplicateCreamOwners = FORBIDDEN_DUPLICATE_CREAM_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateCreamOwners.length > 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate cream ownership through ${duplicateCreamOwners.join(', ')}`,
    );
  }
  const interiorRiserIds = FORBIDDEN_INTERIOR_RISER_IDS
    .filter((id) => ids.includes(id));
  if (interiorRiserIds.length > 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} reintroduces a buried interior riser through ${interiorRiserIds.join(', ')}`,
    );
  }
  const duplicateBeltOwners = FORBIDDEN_DUPLICATE_BELT_OWNER_IDS
    .filter((id) => ids.includes(id));
  if (duplicateBeltOwners.length > 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} reintroduces duplicate material-belt ownership through ${duplicateBeltOwners.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must retain exact continuous-plane geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (
    source.layer === 'upper' &&
    JSON.stringify(creamPathOwners(content)) !== JSON.stringify(['upper-shell'])
  ) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must keep upper-shell as the sole cream path owner`,
    );
  }
  if (
    source.layer === 'upper' &&
    (
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.coral)) !==
        JSON.stringify(['upper-coral-band']) ||
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.green)) !==
        JSON.stringify(['upper-green-handoff'])
    )
  ) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must keep one combined coral owner and one combined green owner across the shared turn`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|overlay|patch|stacked)/i.test(content)) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bSingleFilledCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bSingleFilledCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bSingleFilledCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external review inventory in stable order. */
export async function compileA1bSingleFilledCrossJunctionProposalDirectory(
  options: CompileA1bSingleFilledCrossJunctionProposalOptions,
): Promise<CompiledA1bSingleFilledCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bSingleFilledCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bSingleFilledCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bSingleFilledCrossJunctionProposalSource[] = [];
  for (const source of A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
