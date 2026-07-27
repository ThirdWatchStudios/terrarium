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
      'M11.5 0L128 0 128 79.53 109.396 79.53C100.232 79.53 92.804 86.958 92.804 96.122L92.804 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
    ],
    [
      'upper-shell',
      'M14.819 0L128 0 128 76.211 106.078 76.211C96.914 76.211 89.485 83.64 89.485 92.804L89.485 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
    ],
    [
      'upper-reveal-light',
      'M0 14.819L9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857L14.819 9.036C14.819 10.397 10.807 11.5 9.446 11.5L0 11.5Z',
    ],
    [
      'upper-south-plane-light',
      'M14.819 64.596L88.656 64.596C77.66 64.596 68.744 73.511 68.744 84.507L68.744 128 14.819 128Z',
    ],
    [
      'upper-south-arris-lip',
      'M88.656 64.596L91.144 64.596C80.149 64.596 71.233 73.511 71.233 84.507L71.233 128 68.744 128 68.744 84.507C68.744 73.511 77.66 64.596 88.656 64.596Z',
    ],
    [
      'upper-coral-band',
      'M0 64.596L14.819 64.596 14.819 74.552 0 74.552ZM79.53 128L79.53 74.552 128 74.552 128 64.596 97.781 64.596C92.283 64.596 87.826 69.053 87.826 74.552L87.826 128Z',
    ],
    [
      'upper-green-handoff',
      'M0 74.552L14.819 74.552 14.819 79.53 0 79.53ZM87.826 69.574L92.804 69.574C92.804 72.323 95.032 74.552 97.781 74.552L128 74.552 128 79.53 97.781 79.53C95.032 79.53 92.804 81.758 92.804 84.507L92.804 128 87.826 128Z',
    ],
    [
      'upper-south-face-shade',
      'M91.144 64.596L112.715 64.596C101.719 64.596 92.804 73.511 92.804 84.507L92.804 128 71.233 128 71.233 84.507C71.233 73.511 80.149 64.596 91.144 64.596Z',
    ],
    [
      'upper-arris-seam',
      'M0.75 11.5L9.446 11.5C10.807 11.5 14.819 10.397 14.819 9.036L14.819 0.75M71.233 127L71.233 84.507C71.233 73.511 80.149 64.596 91.144 64.596L111.056 64.596',
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
