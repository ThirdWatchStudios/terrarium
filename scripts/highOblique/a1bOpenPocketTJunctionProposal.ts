import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ShapeSpec } from '../../src/core/types';
import { compileAuthoredSvg } from '../parts/importer';
import { A1A_PALETTE } from './a1aProof';

/** Strict compiler for the proof-only open-pocket T-junction source pair. */

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_CANVAS = 128;

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS = [
  'open_w_t_junction-base',
  'open_w_t_junction-upper',
] as const;

export type A1bOpenPocketTJunctionProposalSourceId =
  (typeof A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_IDS)[number];

export interface A1bOpenPocketTJunctionProposalSourceSpec {
  readonly id: A1bOpenPocketTJunctionProposalSourceId;
  readonly filename: `${A1bOpenPocketTJunctionProposalSourceId}.svg`;
  readonly sourceMaskIndex: 7;
  readonly boundaryRole: 'open-west-t-hub';
  readonly layer: 'base' | 'upper';
  readonly semanticGroup: 'detail/base' | 'detail/upper';
}

const sourceSpec = (
  id: A1bOpenPocketTJunctionProposalSourceId,
  layer: 'base' | 'upper',
): A1bOpenPocketTJunctionProposalSourceSpec => ({
  id,
  filename: `${id}.svg`,
  sourceMaskIndex: 7,
  boundaryRole: 'open-west-t-hub',
  layer,
  semanticGroup: layer === 'base' ? 'detail/base' : 'detail/upper',
});

export const A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY:
readonly A1bOpenPocketTJunctionProposalSourceSpec[] = [
  sourceSpec('open_w_t_junction-base', 'base'),
  sourceSpec('open_w_t_junction-upper', 'upper'),
];

export interface CompiledA1bOpenPocketTJunctionProposalSource
  extends A1bOpenPocketTJunctionProposalSourceSpec {
  readonly sourceFile: string;
  readonly content: string;
  readonly shapes: readonly ShapeSpec[];
}

export interface CompileA1bOpenPocketTJunctionProposalOptions {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export class A1bOpenPocketTJunctionProposalImportError extends Error {
  constructor(message: string) {
    super(`A1b open-pocket T-junction proof-source import: ${message}`);
    this.name = 'A1bOpenPocketTJunctionProposalImportError';
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
    throw new A1bOpenPocketTJunctionProposalImportError(
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

const requiredPath = (content: string, id: string, d: string): boolean =>
  content.includes(`id="${id}" d="${d}"`);

function validateSource(
  source: A1bOpenPocketTJunctionProposalSourceSpec,
  sourceFile: string,
  content: string,
): readonly ShapeSpec[] {
  if (!/\bviewBox\s*=\s*["']0 0 128 128["']/.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must use viewBox 0 0 128 128`,
    );
  }
  if (/\btransform\s*=/.test(content) || /\brotate\s*\(/i.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must be authored in fixed-view coordinates without transforms`,
    );
  }
  const semanticGroup = new RegExp(
    `\\bid\\s*=\\s*["']${source.semanticGroup.replace('/', '\\/')}["']`,
  );
  if (!semanticGroup.test(content)) {
    throw new A1bOpenPocketTJunctionProposalImportError(
      `${sourceFile} must declare a ${source.semanticGroup} source group`,
    );
  }

  if (source.layer === 'base') {
    const required = [
      ['base-contour', 'M103 0H120V95H128V120H120V128H103V120H62V95H103Z'],
      ['base-green', 'M105 0H117V94A3 3 0 0 0 120 97H128V117H120A3 3 0 0 0 117 120V128H105Z'],
      ['base-contact-shade', 'M120 0H123.5V95H120Z M120 120H128V123.5H123.5V128H120Z'],
      ['base-boundary-seam', 'M126 98V116'],
      ['base-south-service-seam', 'M106 126H116'],
    ] as const;
    if (required.some(([id, d]) => !requiredPath(content, id, d))) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the exact open-west T base and seam ownership`,
      );
    }
  } else {
    const required = [
      ['upper-contour', 'M56 0H105V48A8 8 0 0 0 113 56H128V97H105V128H56Z'],
      ['upper-shell', 'M58 0H103V49A9 9 0 0 0 112 58H128V95H103V128H58Z'],
      ['upper-cream-bridge', 'M92 58H128V88H92Z'],
      ['upper-reveal-light', 'M92 58H128V63H92Z'],
      ['upper-coral-band', 'M97 0H102V82A6 6 0 0 0 108 88H128V94H102V128H97Z'],
      ['upper-green-handoff', 'M102 0H105V91A3 3 0 0 0 108 94H128V97H108A3 3 0 0 0 105 100V128H102Z'],
      ['upper-arris-seam', 'M92 1V127 M92 63H127'],
      ['upper-band-seam', 'M102 1V58 M102 94V127 M92 94H127'],
      ['upper-boundary-seam', 'M126 64V96'],
      ['upper-south-service-seam', 'M58 126H104'],
    ] as const;
    if (required.some(([id, d]) => !requiredPath(content, id, d))) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must retain the exact molded T shell and outgoing seam ownership`,
      );
    }
    if (/\bid=["'][^"']*(?:cap|post|rollover|four-way)/i.test(content)) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile} must not introduce a cap, post, rollover, or four-way hub`,
      );
    }
  }

  const shapes = compileAuthoredSvg(content, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length === 0) {
    throw new A1bOpenPocketTJunctionProposalImportError(`${sourceFile} has no authored shapes`);
  }
  for (const [shapeIndex, shape] of shapes.entries()) {
    if (shape.silhouette !== false) {
      throw new A1bOpenPocketTJunctionProposalImportError(
        `${sourceFile}/shape-${shapeIndex + 1} must remain detail art`,
      );
    }
    for (const [channel, paint] of [
      ['fill', shape.fill],
      ['stroke', shape.stroke],
    ] as const) {
      if (paint !== undefined && paint !== 'none' && !APPROVED_PAINTS.has(paint)) {
        throw new A1bOpenPocketTJunctionProposalImportError(
          `${sourceFile}/shape-${shapeIndex + 1} ${channel} uses unapproved paint ${paint}`,
        );
      }
    }
  }
  return shapes;
}

/** Compile the exact two-file external proposal inventory in stable order. */
export async function compileA1bOpenPocketTJunctionProposalDirectory(
  options: CompileA1bOpenPocketTJunctionProposalOptions,
): Promise<CompiledA1bOpenPocketTJunctionProposalSource[]> {
  const prefix = repositoryPrefix(options.sourcePathPrefix);
  const entries = (await readdir(options.inputDir, { withFileTypes: true }))
    .sort((left, right) => compareText(left.name, right.name));
  const expected = new Set<string>(
    A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(({ filename }) => filename),
  );
  const actual = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name === 'README.md') continue;
    if (!entry.isFile() || !expected.has(entry.name)) {
      throw new A1bOpenPocketTJunctionProposalImportError(`unexpected source ${entry.name}`);
    }
    actual.add(entry.name);
  }
  for (const filename of expected) {
    if (!actual.has(filename)) {
      throw new A1bOpenPocketTJunctionProposalImportError(`missing source ${filename}`);
    }
  }

  const compiled: CompiledA1bOpenPocketTJunctionProposalSource[] = [];
  for (const source of A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY) {
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
