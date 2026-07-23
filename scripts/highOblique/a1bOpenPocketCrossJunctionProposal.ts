import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only open-pocket four-way junction source pair. */

export const A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_cross_junction-base',
  'open_cross_junction-upper',
] as const;

export type A1bOpenPocketCrossJunctionProposalSourceId =
  (typeof A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bOpenPocketCrossJunctionProposalSourceSpec {
  readonly id: A1bOpenPocketCrossJunctionProposalSourceId;
  readonly filename: `${A1bOpenPocketCrossJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 15;
  readonly boundaryRole: 'open-pocket-cross-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bOpenPocketCrossJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bOpenPocketCrossJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 15,
  boundaryRole: 'open-pocket-cross-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bOpenPocketCrossJunctionProposalSourceSpec[] = [
  sourceSpec('open_cross_junction-base', 'base'),
  sourceSpec('open_cross_junction-upper', 'upper'),
];

export interface CompiledA1bOpenPocketCrossJunctionProposalSource
  extends A1bOpenPocketCrossJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bOpenPocketCrossJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bOpenPocketCrossJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b open-pocket cross-junction proof-source import: ${message}`);
    this.name = 'A1bOpenPocketCrossJunctionProposalImportError';
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
    throw new A1bOpenPocketCrossJunctionProposalImportError(
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
Record<A1bOpenPocketCrossJunctionProposalSourceId, readonly string[]>
> = {
  'open_cross_junction-base': [
    'detail/base',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_cross_junction-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-north-plane-light',
    'upper-north-arris-lip',
    'upper-green-handoff',
    'upper-coral-band',
    'upper-band-light',
    'upper-north-face-shade',
    'upper-cream-bridge',
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
Record<A1bOpenPocketCrossJunctionProposalSourceId, readonly (readonly [string, string])[]>
> = {
  'open_cross_junction-base': [
    ['base-contour', 'M103 0H120V95H128V120H120V128H103V120H0V95H103Z'],
    ['base-green', 'M105 0H117V94A3 3 0 0 0 120 97H128V117H120A3 3 0 0 0 117 120V128H105V120A3 3 0 0 0 102 117H0V97H102A3 3 0 0 0 105 94Z'],
    ['base-boundary-seam', 'M126 98V116'],
    ['base-south-service-seam', 'M106 126H116'],
  ],
  'open_cross_junction-upper': [
    ['upper-contour', 'M56 0H105V46A10 10 0 0 0 115 56H128V97H115A10 10 0 0 0 105 107V128H56V107A10 10 0 0 0 46 97H0V56H46A10 10 0 0 0 56 46Z'],
    ['upper-shell', 'M58 0H103V48A10 10 0 0 0 113 58H128V95H113A10 10 0 0 0 103 105V128H58V105A10 10 0 0 0 48 95H0V58H48A10 10 0 0 0 58 48Z'],
    ['upper-cream-bridge', 'M0 58H128V88H105V128H58V88H0Z'],
    ['upper-reveal-light', 'M0 58H128V63H0Z'],
    ['upper-coral-band', 'M97 0H102V82A6 6 0 0 0 108 88H128V94H0V88H97Z'],
    ['upper-green-handoff', 'M102 0H105V91A3 3 0 0 0 108 94H128V97H0V94H102Z'],
    ['upper-south-coral-band', 'M97 88H102V128H97Z'],
    ['upper-south-green-handoff', 'M102 94H105V128H102Z'],
    ['upper-arris-seam', 'M92 1V58 M1 63H127 M92 88V127'],
    ['upper-band-seam', 'M102 1V58 M1 94H58 M127 94H108A6 6 0 0 0 102 100V127'],
    ['upper-boundary-seam', 'M126 64V96'],
    ['upper-south-service-seam', 'M58 126H104'],
  ],
};

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

function validateSource(
  source: A1bOpenPocketCrossJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  if (/<(?:use|image)\b/i.test(content) || /\b(?:href|xlink:href)\s*=/.test(content)) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must be flattened authored paths without linked or embedded source art`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  const alteredPaths = EXACT_PATHS[source.id]
    .filter(([id, d]) => !requiredPath(content, id, d))
    .map(([id]) => id);
  if (alteredPaths.length > 0) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must retain exact four-socket geometry for ${alteredPaths.join(', ')}`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|overlay|patch|stacked)/i.test(content)) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, overlay, patch, or stacked source`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bOpenPocketCrossJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bOpenPocketCrossJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bOpenPocketCrossJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external proposal inventory in stable order. */
export async function compileA1bOpenPocketCrossJunctionProposalDirectory(
  options: CompileA1bOpenPocketCrossJunctionProposalOptions,
): Promise<CompiledA1bOpenPocketCrossJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bOpenPocketCrossJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bOpenPocketCrossJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bOpenPocketCrossJunctionProposalSource[] = [];
  for (const source of A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
