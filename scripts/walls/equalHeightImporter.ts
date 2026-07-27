import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import svgpath from 'svgpath';

import type { ShapeSpec } from '../../src/core/types';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
} from '../../src/tiles/blob';
import { compileAuthoredSvg } from '../parts/importer';
import {
  EQUAL_HEIGHT_MASK_LEDGER,
  validateEqualHeightMaskLedger,
  type EqualHeightMaskDerivation,
  type EqualHeightMaskSourceVariant,
} from '../highOblique/equalHeightMaskLedger';
import { derivePromotedSoutheastSourcePair } from '../highOblique/equalHeightWallDirection';

export const QUOTA_CO_EQUAL_HEIGHT_EVALUATION_PROFILE =
  'quota-co-equal-height-evaluation' as const;

/**
 * Connectivity alone cannot distinguish the west/direct and east/mirrored
 * presentations for these three vertical wall rows. The evaluation atlas
 * intentionally bakes the west/direct presentation and leaves the east choice
 * to Unity's SpriteRenderer.flipX context.
 */
export const QUOTA_CO_EQUAL_HEIGHT_FLIP_REQUIRED_MASKS = [1, 4, 5] as const;

const FLIP_REQUIRED_MASK_SET = new Set<number>(
  QUOTA_CO_EQUAL_HEIGHT_FLIP_REQUIRED_MASKS,
);

export interface EqualHeightSourceRoot {
  readonly inputDir: string;
  readonly sourcePathPrefix: string;
}

export interface CompileEqualHeightFramesOptions {
  readonly sourceRoots: readonly EqualHeightSourceRoot[];
}

export interface CompiledEqualHeightFrame {
  readonly id: `mask_${number}`;
  readonly index: number;
  readonly canonicalMask: number;
  readonly shapes: readonly ShapeSpec[];
  readonly source: {
    readonly role: string;
    readonly sourceStem: string;
    readonly baseFile: string;
    readonly upperFile: string;
    readonly transform: EqualHeightMaskSourceVariant['transform'];
    readonly derivation: EqualHeightMaskDerivation;
  };
  readonly sourceFiles: {
    readonly base: string;
    readonly upper: string;
  };
  readonly flipXForEastPresentation: boolean;
}

export class EqualHeightWallImportError extends Error {
  constructor(message: string) {
    super(`QuotaCo equal-height wall import: ${message}`);
    this.name = 'EqualHeightWallImportError';
  }
}

interface IndexedSource {
  readonly absolutePath: string;
  readonly sourceFile: string;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

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
    throw new EqualHeightWallImportError(
      'sourcePathPrefix must be repository-relative',
    );
  }
  return normalized;
}

async function filesUnder(directory: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = (await readdir(current, { withFileTypes: true }))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith('.svg')) {
        files.push(absolutePath);
      }
    }
  };
  await visit(directory);
  return files;
}

async function sourceIndex(
  roots: readonly EqualHeightSourceRoot[],
  requiredFilenames: ReadonlySet<string>,
): Promise<Map<string, IndexedSource>> {
  if (roots.length === 0) {
    throw new EqualHeightWallImportError('at least one source root is required');
  }
  const byFilename = new Map<string, IndexedSource>();
  for (const root of roots) {
    const prefix = repositoryPrefix(root.sourcePathPrefix);
    for (const absolutePath of await filesUnder(root.inputDir)) {
      const filename = path.basename(absolutePath);
      if (!requiredFilenames.has(filename)) continue;
      const relativePath = path
        .relative(root.inputDir, absolutePath)
        .replaceAll(path.sep, '/');
      const source: IndexedSource = {
        absolutePath,
        sourceFile: `${prefix}/${relativePath}`,
      };
      const previous = byFilename.get(filename);
      if (previous) {
        throw new EqualHeightWallImportError(
          `duplicate source ${filename}: ${previous.sourceFile} and ${source.sourceFile}`,
        );
      }
      byFilename.set(filename, source);
    }
  }
  return byFilename;
}

function variantsForEntry(
  index: number,
): readonly EqualHeightMaskSourceVariant[] {
  const entry = EQUAL_HEIGHT_MASK_LEDGER.entries[index];
  if (!entry) {
    throw new EqualHeightWallImportError(`ledger is missing mask_${index}`);
  }
  const { resolution } = entry;
  if (
    resolution.kind === 'synthetic-assembly' ||
    resolution.kind === 'unresolved-authored-geometry' ||
    resolution.status !== 'accepted-source-mapping'
  ) {
    throw new EqualHeightWallImportError(
      `${entry.id} is not an accepted source mapping`,
    );
  }
  return resolution.variants;
}

function evaluationVariantFor(
  index: number,
): EqualHeightMaskSourceVariant {
  const variants = variantsForEntry(index);
  if (FLIP_REQUIRED_MASK_SET.has(index)) {
    const direct = variants.find(
      (variant) =>
        variant.transform === 'none' &&
        variant.derivation === 'none' &&
        variant.role.startsWith('west'),
    );
    if (!direct) {
      throw new EqualHeightWallImportError(
        `mask_${index} lacks its required west/direct evaluation variant`,
      );
    }
    return direct;
  }
  if (variants.length !== 1) {
    throw new EqualHeightWallImportError(
      `mask_${index} has ${variants.length} source variants; expected one`,
    );
  }
  return variants[0];
}

function applyAcceptedDerivation(
  derivation: EqualHeightMaskDerivation,
  baseSource: string,
  upperSource: string,
): { baseSource: string; upperSource: string } {
  if (derivation === 'none') return { baseSource, upperSource };
  if (
    derivation === 'accepted-southeast-seam-filter' ||
    derivation === 'accepted-opposite-diagonal-boundary-seam-filter'
  ) {
    return derivePromotedSoutheastSourcePair(baseSource, upperSource);
  }
  const exhaustive: never = derivation;
  throw new EqualHeightWallImportError(
    `unsupported accepted derivation ${String(exhaustive)}`,
  );
}

function mirrorShapeX(shape: ShapeSpec): ShapeSpec {
  return {
    ...shape,
    d: svgpath(shape.d)
      .matrix([-1, 0, 0, 1, 128, 0])
      .round(3)
      .toString(),
  };
}

function applyTransform(
  transform: EqualHeightMaskSourceVariant['transform'],
  shapes: readonly ShapeSpec[],
): readonly ShapeSpec[] {
  if (transform === 'none') return shapes;
  if (transform === 'mirror-x') return shapes.map(mirrorShapeX);
  const exhaustive: never = transform;
  throw new EqualHeightWallImportError(
    `unsupported accepted transform ${String(exhaustive)}`,
  );
}

/**
 * Compile the owner-accepted ledger atomically into the canonical 47-frame
 * evaluation bank. No proof SVG, ledger row, schema field, or blob mapping is
 * mutated; every frame retains repository-relative source provenance.
 */
export async function compileEqualHeightEvaluationFrames(
  options: CompileEqualHeightFramesOptions,
): Promise<CompiledEqualHeightFrame[]> {
  validateEqualHeightMaskLedger(EQUAL_HEIGHT_MASK_LEDGER);
  const variants = Array.from(
    { length: BLOB_TILE_COUNT },
    (_, index) => evaluationVariantFor(index),
  );
  const requiredFilenames = new Set(
    variants.flatMap((variant) => [variant.baseFile, variant.upperFile]),
  );
  const sources = await sourceIndex(options.sourceRoots, requiredFilenames);
  const frames: CompiledEqualHeightFrame[] = [];

  for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
    const variant = variants[index];
    const base = sources.get(variant.baseFile);
    const upper = sources.get(variant.upperFile);
    if (!base) {
      throw new EqualHeightWallImportError(
        `missing source ${variant.baseFile} for mask_${index}`,
      );
    }
    if (!upper) {
      throw new EqualHeightWallImportError(
        `missing source ${variant.upperFile} for mask_${index}`,
      );
    }
    if (path.dirname(base.absolutePath) !== path.dirname(upper.absolutePath)) {
      throw new EqualHeightWallImportError(
        `${variant.sourceStem} base and upper sources do not share a directory`,
      );
    }

    const derived = applyAcceptedDerivation(
      variant.derivation,
      await readFile(base.absolutePath, 'utf8'),
      await readFile(upper.absolutePath, 'utf8'),
    );
    const compiled = [
      ...compileAuthoredSvg(derived.baseSource, {
        source: base.sourceFile,
        origin: { x: 0, y: 0 },
      }),
      ...compileAuthoredSvg(derived.upperSource, {
        source: upper.sourceFile,
        origin: { x: 0, y: 0 },
      }),
    ];
    const shapes = applyTransform(variant.transform, compiled);

    frames.push({
      id: `mask_${index}`,
      index,
      canonicalMask: BLOB_CONFIGS[index],
      shapes,
      source: {
        role: variant.role,
        sourceStem: variant.sourceStem,
        baseFile: variant.baseFile,
        upperFile: variant.upperFile,
        transform: variant.transform,
        derivation: variant.derivation,
      },
      sourceFiles: {
        base: base.sourceFile,
        upper: upper.sourceFile,
      },
      flipXForEastPresentation: FLIP_REQUIRED_MASK_SET.has(index),
    });
  }

  return frames;
}
