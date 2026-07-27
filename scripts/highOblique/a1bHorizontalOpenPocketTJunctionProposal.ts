import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only horizontal-spine open-pocket T sources. */

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_s_t_junction-base',
  'open_s_t_junction-upper',
  'open_n_t_junction-base',
  'open_n_t_junction-upper',
] as const;

export type A1bHorizontalOpenPocketTJunctionProposalSourceId =
  (typeof A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bHorizontalOpenPocketTJunctionProposalSourceSpec {
  readonly id: A1bHorizontalOpenPocketTJunctionProposalSourceId;
  readonly filename: `${A1bHorizontalOpenPocketTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 11 | 14;
  readonly boundaryRole: 'foreground-open-t-hub' | 'rear-open-t-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bHorizontalOpenPocketTJunctionProposalSourceId,
  sourceMaskIndex: 11 | 14,
  boundaryRole: 'foreground-open-t-hub' | 'rear-open-t-hub',
  layer: 'base' | 'upper',
): A1bHorizontalOpenPocketTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex,
  boundaryRole,
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bHorizontalOpenPocketTJunctionProposalSourceSpec[] = [
  sourceSpec('open_s_t_junction-base', 11, 'foreground-open-t-hub', 'base'),
  sourceSpec('open_s_t_junction-upper', 11, 'foreground-open-t-hub', 'upper'),
  sourceSpec('open_n_t_junction-base', 14, 'rear-open-t-hub', 'base'),
  sourceSpec('open_n_t_junction-upper', 14, 'rear-open-t-hub', 'upper'),
];

export interface CompiledA1bHorizontalOpenPocketTJunctionProposalSource
  extends A1bHorizontalOpenPocketTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bHorizontalOpenPocketTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bHorizontalOpenPocketTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b horizontal open-pocket T-junction proof-source import: ${message}`);
    this.name = 'A1bHorizontalOpenPocketTJunctionProposalImportError';
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
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
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
Record<A1bHorizontalOpenPocketTJunctionProposalSourceId, readonly string[]>
> = {
  'open_s_t_junction-base': [
    'detail/base',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
  ],
  'open_s_t_junction-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light',
    'upper-arris-lip',
    'upper-green-handoff',
    'upper-coral-band',
    'upper-band-light',
    'upper-face-shade',
    'upper-reveal-light',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
  ],
  'open_n_t_junction-base': [
    'detail/base',
    'base-contour',
    'base-green',
    'base-face-shade',
    'base-contact-shade',
    'base-boundary-seam',
    'base-south-service-seam',
  ],
  'open_n_t_junction-upper': [
    'detail/upper',
    'upper-contour',
    'upper-shell',
    'upper-plane-light',
    'upper-arris-lip',
    'upper-coral-band',
    'upper-band-light',
    'upper-green-handoff',
    'upper-face-shade',
    'upper-reveal-light',
    'upper-arris-seam',
    'upper-band-seam',
    'upper-boundary-seam',
    'upper-south-service-seam',
  ],
};

const OPEN_S_UPPER_EXACT_PATHS: readonly (readonly [string, string])[] = [
  [
    'upper-contour',
    'M11.5 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L128 11.5 128 79.53 0 79.53 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z',
  ],
  [
    'upper-shell',
    'M14.819 0L89.485 0 89.485 9.446C89.485 10.807 98.4 14.819 109.396 14.819L128 14.819 128 76.211 0 76.211 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z',
  ],
  [
    'upper-plane-light',
    'M14.819 0L68.744 0 68.744 9.036C68.744 10.397 77.66 11.5 88.656 11.5L14.819 11.5Z',
  ],
  [
    'upper-arris-lip',
    'M68.744 0L71.233 0 71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L88.656 11.5C77.66 11.5 68.744 10.397 68.744 9.036Z',
  ],
  [
    'upper-coral-band',
    'M79.53 0L87.826 0 87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5L99.441 11.5C88.445 11.5 79.53 10.397 79.53 9.036ZM0 64.596L128 64.596 128 74.552 0 74.552Z',
  ],
  ['upper-band-light', 'M0 64.596L128 64.596 128 67.085 0 67.085Z'],
  [
    'upper-green-handoff',
    'M87.826 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L107.737 11.5C96.741 11.5 87.826 10.397 87.826 9.036ZM0 74.552L128 74.552 128 79.53 0 79.53Z',
  ],
  [
    'upper-face-shade',
    'M71.233 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L91.144 11.5C80.149 11.5 71.233 10.397 71.233 9.036Z',
  ],
  ['upper-reveal-light', 'M0 14.819L128 14.819 128 23.115 0 23.115Z'],
  [
    'upper-arris-seam',
    'M71.233 0.75L71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L111.056 11.5M0.75 23.115L127 23.115',
  ],
  [
    'upper-band-seam',
    'M87.826 0.75L87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5M0.75 74.552L127 74.552',
  ],
  ['upper-boundary-seam', 'M126 24.774L126 77.87'],
];

const OPEN_S_UPPER_LAYER_ORDER = OPEN_S_UPPER_EXACT_PATHS.map(
  ([id]) => id,
);

const OPEN_N_UPPER_EXACT_PATHS: readonly (readonly [string, string])[] = [
  [
    'upper-contour',
    'M0 11.5L128 11.5 128 79.53 109.396 79.53C100.232 79.53 92.804 86.958 92.804 96.122L92.804 128 11.5 128 11.5 96.122C11.5 86.958 10.581 79.53 9.446 79.53L0 79.53Z',
  ],
  [
    'upper-shell',
    'M0 14.819L128 14.819 128 76.211 106.078 76.211C96.914 76.211 89.485 83.64 89.485 92.804L89.485 128 14.819 128 14.819 92.804C14.819 83.64 10.991 76.211 9.857 76.211L0 76.211Z',
  ],
  ['upper-plane-light', 'M14.819 64.596L68.744 64.596 68.744 128 14.819 128Z'],
  ['upper-arris-lip', 'M68.744 64.596L71.233 64.596 71.233 128 68.744 128Z'],
  [
    'upper-coral-band',
    'M0 64.596L14.819 64.596 14.819 74.552 0 74.552ZM79.53 128L79.53 74.552 128 74.552 128 64.596 97.781 64.596C92.283 64.596 87.826 69.053 87.826 74.552L87.826 128Z',
  ],
  [
    'upper-band-light',
    'M0 64.596L14.819 64.596 14.819 67.085 0 67.085ZM97.781 64.596L128 64.596 128 67.085 97.781 67.085Z',
  ],
  [
    'upper-green-handoff',
    'M0 74.552L14.819 74.552 14.819 79.53 0 79.53ZM87.826 69.574L92.804 69.574C92.804 72.323 95.032 74.552 97.781 74.552L128 74.552 128 79.53 97.781 79.53C95.032 79.53 92.804 81.758 92.804 84.507L92.804 128 87.826 128Z',
  ],
  ['upper-face-shade', 'M71.233 64.596L92.804 64.596 92.804 128 71.233 128Z'],
  ['upper-reveal-light', 'M0 14.819L128 14.819 128 23.115 0 23.115Z'],
  ['upper-arris-seam', 'M0.75 23.115L127 23.115M71.233 64.596L71.233 127'],
  [
    'upper-band-seam',
    'M0.75 74.552L14.819 74.552M127 74.552L97.781 74.552C92.283 74.552 87.826 79.009 87.826 84.507L87.826 127',
  ],
  ['upper-boundary-seam', 'M126 24.774L126 77.87'],
  ['upper-south-service-seam', 'M14.819 126L91.144 126'],
];

const OPEN_N_UPPER_LAYER_ORDER = OPEN_N_UPPER_EXACT_PATHS.map(
  ([id]) => id,
);

const sourceIds = (content: string): readonly string[] =>
  [...content.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

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
  source: A1bHorizontalOpenPocketTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }

  const ids = sourceIds(content);
  if (new Set(ids).size !== ids.length) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must not duplicate semantic ids`,
    );
  }
  const missing = REQUIRED_SOURCE_IDS[source.id].filter((id) => !ids.includes(id));
  if (missing.length > 0) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} is missing required semantic ids ${missing.join(', ')}`,
    );
  }
  if (source.id === 'open_s_t_junction-upper') {
    const alteredPaths = OPEN_S_UPPER_EXACT_PATHS
      .filter(([id, d]) => !requiredPath(content, id, d))
      .map(([id]) => id);
    if (alteredPaths.length > 0) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain exact shared-lip geometry for ${alteredPaths.join(', ')}`,
      );
    }
    const pathOrder = OPEN_S_UPPER_LAYER_ORDER.map(
      (id) => content.indexOf(`id="${id}"`),
    );
    if (pathOrder.some((position, index) =>
      index > 0 && position <= pathOrder[index - 1])) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the shared-lip paint hierarchy`,
      );
    }
    if (
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.cream)) !==
        JSON.stringify(['upper-shell']) ||
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.coral)) !==
        JSON.stringify(['upper-coral-band']) ||
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.green)) !==
        JSON.stringify(['upper-green-handoff'])
    ) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must keep one cream, coral, and green owner across the shared lip`,
      );
    }
  }
  if (source.id === 'open_n_t_junction-upper') {
    const alteredPaths = OPEN_N_UPPER_EXACT_PATHS
      .filter(([id, d]) => !requiredPath(content, id, d))
      .map(([id]) => id);
    if (alteredPaths.length > 0) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain exact rear shared-turn geometry for ${alteredPaths.join(', ')}`,
      );
    }
    const pathOrder = OPEN_N_UPPER_LAYER_ORDER.map(
      (id) => content.indexOf(`id="${id}"`),
    );
    if (pathOrder.some((position, index) =>
      index > 0 && position <= pathOrder[index - 1])) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the rear shared-turn paint hierarchy`,
      );
    }
    if (
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.cream)) !==
        JSON.stringify(['upper-shell']) ||
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.coral)) !==
        JSON.stringify(['upper-coral-band']) ||
      JSON.stringify(paintPathOwners(content, A1A_PALETTE.green)) !==
        JSON.stringify(['upper-green-handoff'])
    ) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile} must keep one cream, coral, and green owner across the rear shared turn`,
      );
    }
    for (const legacyId of [
      'upper-cream-bridge',
      'upper-horizontal-coral-band',
      'upper-horizontal-green-handoff',
      'upper-branch-coral-band',
      'upper-branch-green-handoff',
    ]) {
      if (ids.includes(legacyId)) {
        throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
          `${sourceFile} must not retain legacy split owner ${legacyId}`,
        );
      }
    }
  }
  if (/\bid=["'][^"']*(?:cap|post|pylon|rollover|four-way)/i.test(content)) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} must not introduce a cap, post, pylon, rollover, or four-way hub`,
    );
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
      `${sourceFile} has no authored shapes`,
    );
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact four-file external proposal inventory in stable order. */
export async function compileA1bHorizontalOpenPocketTJunctionProposalDirectory(
  options: CompileA1bHorizontalOpenPocketTJunctionProposalOptions,
): Promise<CompiledA1bHorizontalOpenPocketTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
      ({ filename }) => filename,
    ),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `unexpected source ${entry.name}`,
      );
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bHorizontalOpenPocketTJunctionProposalImportError(
        `missing source ${filename}`,
      );
    }
  }

  const compiled: CompiledA1bHorizontalOpenPocketTJunctionProposalSource[] = [];
  for (const source of A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
