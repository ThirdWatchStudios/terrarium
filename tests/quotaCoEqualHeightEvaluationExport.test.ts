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
import {
  compileEqualHeightEvaluationFrames,
  QUOTA_CO_EQUAL_HEIGHT_EVALUATION_PROFILE,
  QUOTA_CO_EQUAL_HEIGHT_FLIP_REQUIRED_MASKS,
  type CompiledEqualHeightFrame,
} from '../scripts/walls/equalHeightImporter';
import {
  composeWallShapes,
  composeWallTile,
} from '../src/core/compositor';
import {
  exportAll,
  type SheetDesc,
} from '../src/core/exporter';
import type { ShapeSpec } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
} from '../src/tiles/blob';

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

describe('QuotaCo equal-height evaluation export bridge', () => {
  it('compiles exactly 47 canonical frames in unchanged blob order', async () => {
    const result = await frames();
    expect(QUOTA_CO_EQUAL_HEIGHT_EVALUATION_PROFILE).toBe(
      'quota-co-equal-height-evaluation',
    );
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

  it('produces byte-stable frame records across repeated compilation', async () => {
    const first = await compileEqualHeightEvaluationFrames({
      sourceRoots: SOURCE_ROOTS,
    });
    const second = await compileEqualHeightEvaluationFrames({
      sourceRoots: SOURCE_ROOTS,
    });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('matches accepted composed pixels for direct, mirror, filtered, and filled representatives', async () => {
    const result = await frames();
    const project = defaultProject();
    const officeWall = project.walls.find(({ id }) => id === 'wall-office');
    expect(officeWall).toBeDefined();
    for (const index of [3, 12, 9, 46]) {
      const frame = result[index];
      const compiledPixels = new Resvg(
        composeWallShapes(
          frame.shapes,
          officeWall!,
          project.style,
          128,
        ),
        { font: { loadSystemFonts: false } },
      ).render().pixels;
      expect(
        Buffer.from(compiledPixels).equals(
          Buffer.from(acceptedSourcePixels(frame)),
        ),
        frame.id,
      ).toBe(true);
    }
  });

  it('overrides only wall-office through the full export path', async () => {
    const result = await frames();
    const project = defaultProject();
    const renderedSheets = new Map<string, SheetDesc>();
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
          if (file.endsWith('/tileset@1x.png')) {
            expect(latestSheet, file).toBeDefined();
            renderedSheets.set(file, latestSheet!);
          }
        },
      },
      wallEvaluation: {
        profile: QUOTA_CO_EQUAL_HEIGHT_EVALUATION_PROFILE,
        wallId: 'wall-office',
        frames: result,
      },
    });

    const officeWall = project.walls.find(({ id }) => id === 'wall-office');
    expect(officeWall).toBeDefined();
    const officeSheet = renderedSheets.get('walls/office-wall/tileset@1x.png');
    expect(officeSheet?.cells).toHaveLength(BLOB_TILE_COUNT);
    for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
      expect(officeSheet!.cells[index].svg, `wall-office/mask_${index}`).toBe(
        composeWallShapes(
          result[index].shapes,
          officeWall!,
          project.style,
          project.style.render.baseSize,
        ),
      );
    }
    expect(officeSheet!.cells[0].svg).not.toBe(
      composeWallTile(
        officeWall!,
        project.style,
        BLOB_CONFIGS[0],
        project.style.render.baseSize,
      ),
    );

    for (const wall of project.walls.filter(({ id }) => id !== 'wall-office')) {
      const slug = wall.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const sheet = renderedSheets.get(`walls/${slug}/tileset@1x.png`);
      expect(sheet?.cells, wall.id).toHaveLength(BLOB_TILE_COUNT);
      for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
        expect(sheet!.cells[index].svg, `${wall.id}/mask_${index}`).toBe(
          composeWallTile(
            wall,
            project.style,
            BLOB_CONFIGS[index],
            project.style.render.baseSize,
          ),
        );
      }
    }
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
