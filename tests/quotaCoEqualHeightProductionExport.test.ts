import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import svgpath from 'svgpath';
import { describe, expect, it } from 'vitest';

import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
import { equalHeightAllMaskSourceFootprintState } from '../scripts/highOblique/equalHeightFootprintAllMaskCalibration';
import {
  compileEqualHeightEvaluationFrames,
  QUOTA_CO_EQUAL_HEIGHT_FLIP_REQUIRED_MASKS,
  emitQuotaCoEqualHeightWallRegistry,
  type CompiledEqualHeightFrame,
} from '../scripts/walls/equalHeightImporter';
import {
  composeWallShapes,
  composeWallTile,
} from '../src/core/compositor';
import {
  exportAll,
  wallAtlas,
  type SheetDesc,
} from '../src/core/exporter';
import {
  clinicalSurfaceColor,
  projectWithLook,
} from '../src/core/look';
import type { ShapeSpec } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
} from '../src/tiles/blob';
import { QUOTA_CO_EQUAL_HEIGHT_WALL_ART } from '../src/tiles/generated/importedQuotaCoEqualHeightWallArt';

const SOURCE_ROOTS = [
  {
    inputDir: path.resolve('assets/walls/quota-co-building-system'),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.resolve(
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

let compiledFrames: Promise<CompiledEqualHeightFrame[]> | undefined;

function frames(): Promise<CompiledEqualHeightFrame[]> {
  compiledFrames ??= compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  return compiledFrames;
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

const stripSvgShell = (source: string): string =>
  source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function acceptedSourcePixels(frame: CompiledEqualHeightFrame): Uint8Array {
  const baseSource = readFileSync(path.resolve(frame.sourceFiles.base), 'utf8');
  const upperSource = readFileSync(
    path.resolve(frame.sourceFiles.upper),
    'utf8',
  );
  const derived = frame.source.derivation === 'none'
    ? { baseSource, upperSource }
    : derivePromotedSoutheastSourcePair(baseSource, upperSource);
  const content =
    stripSvgShell(derived.baseSource) + stripSvgShell(derived.upperSource);
  const transformed = frame.source.transform === 'mirror-x'
    ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
    : content;
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${transformed}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render().pixels;
}

describe('retired QuotaCo equal-height source bank and quiet-wall production handoff', () => {
  it('compiles exactly 47 canonical frames in unchanged blob order', async () => {
    const result = await frames();
    expect(equalHeightAllMaskSourceFootprintState(result)).toBe('accepted-112');
    expect(result).toHaveLength(BLOB_TILE_COUNT);
    expect(result.map(({ id }) => id)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    expect(result.map(({ index }) => index)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => index),
    );
    expect(result.map(({ canonicalMask }) => canonicalMask)).toEqual(
      BLOB_CONFIGS,
    );
    expect(result.every(({ shapes }) => shapes.length > 0)).toBe(true);
  });

  it('resolves every selected source to stable repository-relative provenance', async () => {
    const result = await frames();
    expect(result[0]).toMatchObject({
      source: {
        role: 'isolated-shell',
        sourceStem: 'isolated_shell',
        baseFile: 'isolated_shell-base.svg',
        upperFile: 'isolated_shell-upper.svg',
        transform: 'none',
        derivation: 'none',
      },
      sourceFiles: {
        base:
          'assets/walls/quota-co-building-system-proofs/isolated-shell/isolated_shell-base.svg',
        upper:
          'assets/walls/quota-co-building-system-proofs/isolated-shell/isolated_shell-upper.svg',
      },
    });
    expect(result[3].sourceFiles).toEqual({
      base:
        'assets/walls/quota-co-building-system/transition_w_to_s-base.svg',
      upper:
        'assets/walls/quota-co-building-system/transition_w_to_s-upper.svg',
    });
    expect(result[46].sourceFiles).toEqual({
      base:
        'assets/walls/quota-co-building-system-proofs/fully-filled-cross-junction/filled_center-base.svg',
      upper:
        'assets/walls/quota-co-building-system-proofs/fully-filled-cross-junction/filled_center-upper.svg',
    });
    for (const frame of result) {
      expect(path.posix.isAbsolute(frame.sourceFiles.base), frame.id).toBe(false);
      expect(path.posix.isAbsolute(frame.sourceFiles.upper), frame.id).toBe(
        false,
      );
      expect(frame.sourceFiles.base.endsWith(frame.source.baseFile), frame.id)
        .toBe(true);
      expect(
        frame.sourceFiles.upper.endsWith(frame.source.upperFile),
        frame.id,
      ).toBe(true);
    }
  });

  it('selects west/direct art only for the three context-flippable masks', async () => {
    const result = await frames();
    expect([...QUOTA_CO_EQUAL_HEIGHT_FLIP_REQUIRED_MASKS]).toEqual([1, 4, 5]);
    expect(
      result
        .filter(({ flipXForEastPresentation }) => flipXForEastPresentation)
        .map(({ index }) => index),
    ).toEqual([1, 4, 5]);
    expect(result[1].source).toMatchObject({
      role: 'west-south-terminus',
      transform: 'none',
      derivation: 'none',
    });
    expect(result[4].source).toMatchObject({
      role: 'west-north-terminus',
      transform: 'none',
      derivation: 'none',
    });
    expect(result[5].source).toMatchObject({
      role: 'west-wall',
      transform: 'none',
      derivation: 'none',
    });
  });

  it('applies accepted seam filters before whole-cell mirror transforms', async () => {
    const result = await frames();
    const filteredPairs = [
      [3, 9],
      [7, 13],
      [16, 34],
      [18, 35],
      [17, 36],
      [30, 40],
    ] as const;
    for (const [directIndex, filteredIndex] of filteredPairs) {
      const direct = result[directIndex];
      const filtered = result[filteredIndex];
      expect(filtered.source.transform, filtered.id).toBe('mirror-x');
      expect(filtered.source.derivation, filtered.id).toMatch(
        /^accepted-(?:southeast-seam|opposite-diagonal-boundary-seam)-filter$/,
      );
      expect(filtered.shapes, filtered.id).toHaveLength(
        direct.shapes.length - 2,
      );
    }

    expect(result[12].shapes.map(mirrorShapeX)).toEqual(result[6].shapes);
  });

  it('keeps the archived browser-safe registry byte-current and deterministic', async () => {
    const first = await compileEqualHeightEvaluationFrames({
      sourceRoots: SOURCE_ROOTS,
    });
    const second = await compileEqualHeightEvaluationFrames({
      sourceRoots: SOURCE_ROOTS,
    });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    const projection = first.map((frame) => ({
      id: frame.id,
      index: frame.index,
      canonicalMask: frame.canonicalMask,
      flipXForEastPresentation: frame.flipXForEastPresentation,
      shapes: frame.shapes,
    }));
    expect(QUOTA_CO_EQUAL_HEIGHT_WALL_ART).toEqual(projection);

    const emitted = emitQuotaCoEqualHeightWallRegistry(first);
    expect(emitQuotaCoEqualHeightWallRegistry(second)).toBe(emitted);
    expect(
      readFileSync(
        path.resolve(
          'src/tiles/generated/importedQuotaCoEqualHeightWallArt.ts',
        ),
        'utf8',
      ),
    ).toBe(emitted);
  });

  it('retains the accepted equal-height source bank as reproducible archive art, not production dispatch', async () => {
    const result = await frames();
    const project = defaultProject();
    const officeWall = project.walls.find(({ id }) => id === 'wall-office')!;
    for (const index of [3, 12, 9, 46]) {
      const sourceFrame = result[index];
      const archivedFrame = QUOTA_CO_EQUAL_HEIGHT_WALL_ART[index];
      const archivedPixels = new Resvg(
        composeWallShapes(archivedFrame.shapes, officeWall, project.style, 128),
        { font: { loadSystemFonts: false } },
      ).render().pixels;
      expect(
        Buffer.from(archivedPixels).equals(Buffer.from(acceptedSourcePixels(sourceFrame))),
        archivedFrame.id,
      ).toBe(true);
    }

    expect(composeWallTile(officeWall, project.style, BLOB_CONFIGS[0], 128))
      .not.toContain('#B65F4D');
    expect(wallAtlas(officeWall, project.style, 1).meta).toMatchObject({
      orientation: 'topology-only',
    });
    expect(wallAtlas(officeWall, project.style, 1).meta)
      .not.toHaveProperty('contextualFacing');
  });

  it('uses only the five retained wall families through the ordinary full export path', async () => {
    const project = defaultProject();
    const wallPaths = new Set<string>();
    let latestSheet: SheetDesc | undefined;

    await exportAll(project, {
      rasterizer: {
        async rasterizeSheet(desc) {
          latestSheet = desc;
          return new Uint8Array([0]);
        },
      },
      sink: {
        file(file) {
          if (file.startsWith('walls/')) wallPaths.add(file);
          if (/walls\/office-wall\/tileset@[124]x\.png$/.test(file)) {
            expect(latestSheet?.cells).toHaveLength(BLOB_TILE_COUNT);
          }
        },
      },
    });

    for (const slug of ['office-wall', 'cubicle-partition', 'brick-wall', 'panel-wall', 'wood-slat-wall']) {
      expect([...wallPaths].some((file) => file.startsWith(`walls/${slug}/`)), slug).toBe(true);
    }
    for (const slug of ['glass-partition', 'demising-wall', 'curtain-wall', 'living-wall', 'branded-wall']) {
      expect([...wallPaths].some((file) => file.startsWith(`walls/${slug}/`)), slug).toBe(false);
    }
  });

  it('drains fixed production detail colors under the clinical project look', () => {
    const raw = defaultProject();
    raw.look = 'clinical';
    const clinical = projectWithLook(raw);
    const rawWall = raw.walls.find(({ id }) => id === 'wall-office');
    const clinicalWall = clinical.walls.find(
      ({ id }) => id === 'wall-office',
    );
    expect(rawWall).toBeDefined();
    expect(clinicalWall).toBeDefined();

    const rawSvg = composeWallTile(
      rawWall!,
      raw.style,
      BLOB_CONFIGS[0],
    );
    const clinicalSvg = composeWallTile(
      clinicalWall!,
      clinical.style,
      BLOB_CONFIGS[0],
    );
    expect(clinicalSvg).not.toBe(rawSvg);

    expect(rawSvg).toContain('#323431');
    expect(clinicalSvg).toContain(clinicalSurfaceColor('#323431'));
  });

  it('ignores duplicate unrelated SVGs but rejects a duplicate required source', async () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), 'quota-co-wall-import-'),
    );
    try {
      mkdirSync(path.join(temporaryRoot, 'a'));
      mkdirSync(path.join(temporaryRoot, 'b'));
      writeFileSync(path.join(temporaryRoot, 'a', 'unused.svg'), '<svg/>');
      writeFileSync(path.join(temporaryRoot, 'b', 'unused.svg'), '<svg/>');

      await expect(
        compileEqualHeightEvaluationFrames({
          sourceRoots: [
            ...SOURCE_ROOTS,
            {
              inputDir: temporaryRoot,
              sourcePathPrefix: 'test-fixtures/unrelated',
            },
          ],
        }),
      ).resolves.toHaveLength(BLOB_TILE_COUNT);

      writeFileSync(
        path.join(temporaryRoot, 'isolated_shell-base.svg'),
        '<svg/>',
      );
      await expect(
        compileEqualHeightEvaluationFrames({
          sourceRoots: [
            ...SOURCE_ROOTS,
            {
              inputDir: temporaryRoot,
              sourcePathPrefix: 'test-fixtures/duplicate-required',
            },
          ],
        }),
      ).rejects.toThrow(/duplicate source isolated_shell-base\.svg/);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
});
