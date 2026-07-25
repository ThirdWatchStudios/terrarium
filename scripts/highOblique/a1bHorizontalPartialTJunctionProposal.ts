import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the accepted proof-layer horizontal single-filled-pocket T masters. */

export const A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_s_t_filled_ne-base',
  'open_s_t_filled_ne-upper',
  'open_n_t_filled_se-base',
  'open_n_t_filled_se-upper',
] as const;

export type A1bHorizontalPartialTJunctionProposalSourceId =
  (typeof A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bHorizontalPartialTJunctionProposalSourceSpec {
  readonly id: A1bHorizontalPartialTJunctionProposalSourceId;
  readonly filename: `${A1bHorizontalPartialTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 18 | 22;
  readonly fixedLightRole: 'foreground-transition' | 'rear-transition';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bHorizontalPartialTJunctionProposalSourceId,
  sourceMaskIndex: 18 | 22,
  fixedLightRole: 'foreground-transition' | 'rear-transition',
  layer: 'base' | 'upper',
): A1bHorizontalPartialTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  fixedLightRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bHorizontalPartialTJunctionProposalSourceSpec[] = [
  sourceSpec('open_s_t_filled_ne-base', 18, 'foreground-transition', 'base'),
  sourceSpec('open_s_t_filled_ne-upper', 18, 'foreground-transition', 'upper'),
  sourceSpec('open_n_t_filled_se-base', 22, 'rear-transition', 'base'),
  sourceSpec('open_n_t_filled_se-upper', 22, 'rear-transition', 'upper'),
];

export interface CompiledA1bHorizontalPartialTJunctionProposalSource
  extends A1bHorizontalPartialTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bHorizontalPartialTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bHorizontalPartialTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b horizontal partial T-junction proof-source import: ${message}`);
    this.name = 'A1bHorizontalPartialTJunctionProposalImportError';
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
    throw new A1bHorizontalPartialTJunctionProposalImportError(
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
Record<A1bHorizontalPartialTJunctionProposalSourceId, readonly string[]>
> = {
  'open_s_t_filled_ne-base': [
    'detail/base',
    'base-buried-ne-underlay',
    'base-contour',
    'base-green-open-nw',
    'base-contact-shade-open-nw',
    'base-boundary-seam',
  ],
  'open_s_t_filled_ne-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-reveal-open-nw',
    'upper-south-face-shade',
    'upper-coral-open-nw',
    'upper-band-light',
    'upper-green-open-nw',
    'upper-plinth',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
  ],
  'open_n_t_filled_se-base': [
    'detail/base',
    'base-buried-se-underlay',
    'base-contour-open-sw',
    'base-green-open-sw',
    'base-face-shade-open-sw',
    'base-contact-shade-open-sw',
  ],
  'open_n_t_filled_se-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light-open-sw',
    'upper-coral-open-sw',
    'upper-band-light',
    'upper-green-open-sw',
    'upper-face-shade-open-sw',
    'upper-solid-top-highlight',
    'upper-arris-seam',
    'upper-band-seam',
  ],
};

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

function validateSource(
  source: A1bHorizontalPartialTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (
    source.id === 'open_n_t_filled_se-upper' &&
    !requiredPath(
      content,
      'upper-plane-light-open-sw',
      'M0 58H58V63H0Z',
    )
  ) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} must stop the open-side reveal at the solid-top highlight boundary`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|four-way|overlay|patch)/i.test(content)) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, four-way hub, overlay, or patch`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bHorizontalPartialTJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bHorizontalPartialTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bHorizontalPartialTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file external proof-source inventory in stable order. */
export async function compileA1bHorizontalPartialTJunctionProposalDirectory(
  options: CompileA1bHorizontalPartialTJunctionProposalOptions,
): Promise<CompiledA1bHorizontalPartialTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bHorizontalPartialTJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bHorizontalPartialTJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bHorizontalPartialTJunctionProposalSource[] = [];
  for (const source of A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
