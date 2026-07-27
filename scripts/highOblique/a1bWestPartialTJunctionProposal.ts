import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the owner-accepted proof-layer west-side one-filled-pocket T sources. */

export const A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_w_t_filled_ne-base',
  'open_w_t_filled_ne-upper',
  'open_w_t_filled_se-base',
  'open_w_t_filled_se-upper',
] as const;

export type A1bWestPartialTJunctionProposalSourceId =
  (typeof A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bWestPartialTJunctionProposalSourceSpec {
  readonly id: A1bWestPartialTJunctionProposalSourceId;
  readonly filename: `${A1bWestPartialTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 17 | 21;
  readonly fixedLightRole: 'foreground-transition' | 'rear-transition';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bWestPartialTJunctionProposalSourceId,
  sourceMaskIndex: 17 | 21,
  fixedLightRole: 'foreground-transition' | 'rear-transition',
  layer: 'base' | 'upper',
): A1bWestPartialTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  fixedLightRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bWestPartialTJunctionProposalSourceSpec[] = [
  sourceSpec('open_w_t_filled_ne-base', 17, 'foreground-transition', 'base'),
  sourceSpec('open_w_t_filled_ne-upper', 17, 'foreground-transition', 'upper'),
  sourceSpec('open_w_t_filled_se-base', 21, 'rear-transition', 'base'),
  sourceSpec('open_w_t_filled_se-upper', 21, 'rear-transition', 'upper'),
];

export interface CompiledA1bWestPartialTJunctionProposalSource
  extends A1bWestPartialTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bWestPartialTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bWestPartialTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b west partial T-junction proof-source import: ${message}`);
    this.name = 'A1bWestPartialTJunctionProposalImportError';
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
    throw new A1bWestPartialTJunctionProposalImportError(
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
Record<A1bWestPartialTJunctionProposalSourceId, readonly string[]>
> = {
  'open_w_t_filled_ne-base': [
    'detail/base',
    'base-buried-ne-underlay',
    'base-green-open-se',
    'base-face-shade-open-se',
    'base-contact-shade-open-se',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_w_t_filled_ne-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light-open-se',
    'upper-arris-lip-open-se',
    'upper-green-open-se',
    'upper-coral-open-se',
    'upper-band-light',
    'upper-face-shade-open-se',
    'upper-cream-bridge',
    'upper-south-face-shade',
    'upper-lip-seam',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
    'upper-south-service-seam',
  ],
  'open_w_t_filled_se-base': [
    'detail/base',
    'base-buried-se-underlay',
    'base-contour-open-ne',
    'base-green-open-ne',
    'base-face-shade-open-ne',
    'base-contact-shade-open-ne',
  ],
  'open_w_t_filled_se-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light-open-ne',
    'upper-arris-lip-open-ne',
    'upper-green-open-ne',
    'upper-coral-open-ne',
    'upper-face-shade-open-ne',
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
  source: A1bWestPartialTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (
    source.id === 'open_w_t_filled_ne-base' &&
    !requiredPath(
      content,
      'base-contact-shade-open-se',
      'M120 91H123.5V95H120Z M120 120H128V123.5H123.5V128H120Z',
    )
  ) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must clip the foreground contact shade around the continuing south socket`,
    );
  }
  if (
    source.id === 'open_w_t_filled_ne-upper' &&
    (
      !requiredPath(content, 'upper-south-face-shade', 'M103 63H128V84H103Z') ||
      !requiredPath(content, 'upper-lip-seam', 'M103 87H127')
    )
  ) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must retain the accepted cream lip and dark separation line above coral`,
    );
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|four-way|overlay|patch)/i.test(content)) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, four-way hub, overlay, or patch`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bWestPartialTJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bWestPartialTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bWestPartialTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file external proof-source inventory in stable order. */
export async function compileA1bWestPartialTJunctionProposalDirectory(
  options: CompileA1bWestPartialTJunctionProposalOptions,
): Promise<CompiledA1bWestPartialTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bWestPartialTJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bWestPartialTJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bWestPartialTJunctionProposalSource[] = [];
  for (const source of A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
