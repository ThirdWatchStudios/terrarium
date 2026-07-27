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
    ['base-contour', 'M89.485 0L117.693 0 117.693 76.211 128 76.211 128 117.693 117.693 117.693 117.693 128 89.485 128 89.485 117.693 0 117.693 0 76.211 89.485 76.211Z'],
    ['base-green', 'M92.804 0L112.715 0 112.715 74.552C112.715 77.301 114.943 79.53 117.693 79.53L128 79.53 128 112.715 117.693 112.715C114.943 112.715 112.715 114.943 112.715 117.693L112.715 128 92.804 128 92.804 117.693C92.804 114.943 90.575 112.715 87.826 112.715L0 112.715 0 79.53 87.826 79.53C90.575 79.53 92.804 77.301 92.804 74.552Z'],
    ['base-boundary-seam', 'M126 81.189L126 111.056'],
    ['base-south-service-seam', 'M94.463 126L111.056 126'],
  ],
  'open_cross_junction-upper': [
    ['upper-contour', 'M11.5 0L92.804 0 92.804 9.446C92.804 10.581 100.232 11.5 109.396 11.5L128 11.5 128 79.53 109.396 79.53C100.232 79.53 92.804 86.958 92.804 96.122L92.804 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z'],
    ['upper-shell', 'M14.819 0L89.485 0 89.485 9.857C89.485 10.991 96.914 14.819 106.078 14.819L128 14.819 128 76.211 106.078 76.211C96.914 76.211 89.485 83.64 89.485 92.804L89.485 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z'],
    ['upper-cream-bridge', 'M0 14.819L128 14.819 128 64.596 92.804 64.596 92.804 128 14.819 128 14.819 64.596 0 64.596Z'],
    ['upper-reveal-light', 'M0 14.819L128 14.819 128 23.115 0 23.115Z'],
    ['upper-coral-band', 'M79.53 0L87.826 0 87.826 54.641C87.826 60.14 92.283 64.596 97.781 64.596L128 64.596 128 74.552 0 74.552 0 64.596 79.53 64.596Z'],
    ['upper-green-handoff', 'M87.826 0L92.804 0 92.804 69.574C92.804 72.323 95.032 74.552 97.781 74.552L128 74.552 128 79.53 0 79.53 0 74.552 87.826 74.552Z'],
    ['upper-south-coral-band', 'M79.53 64.596L87.826 64.596 87.826 128 79.53 128Z'],
    ['upper-south-green-handoff', 'M87.826 74.552L92.804 74.552 92.804 128 87.826 128Z'],
    ['upper-arris-seam', 'M71.233 0.75L71.233 14.819M0.75 23.115L127 23.115M71.233 64.596L71.233 127'],
    ['upper-band-seam', 'M87.826 0.75L87.826 14.819M0.75 74.552L14.819 74.552M127 74.552L97.781 74.552C92.283 74.552 87.826 79.009 87.826 84.507L87.826 127'],
    ['upper-boundary-seam', 'M126 24.774L126 77.87'],
    ['upper-south-service-seam', 'M14.819 126L91.144 126'],
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
