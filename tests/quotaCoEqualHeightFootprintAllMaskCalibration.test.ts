import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import svgpath from 'svgpath';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_ALL_MASK_IDENTITY,
  EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY,
  EQUAL_HEIGHT_ALL_MASK_X_ONLY,
  EQUAL_HEIGHT_ALL_MASK_Y_ONLY,
  compileSelectedEqualHeightAllMaskFrames,
  equalHeightAllMaskSourceFootprintState,
  equalHeightAllMaskCalibration,
  equalHeightAllMaskWarpMode,
  warpEqualHeightAllMaskCoordinate,
  warpEqualHeightAllMaskPath,
  type CalibratedEqualHeightFrame,
} from '../scripts/highOblique/equalHeightFootprintAllMaskCalibration';
import {
  EQUAL_HEIGHT_FOOTPRINT_PROFILES,
  calibrateEqualHeightFootprintShapes,
} from '../scripts/highOblique/equalHeightFootprintCalibration';
import {
  enumerateEqualHeightSocketRegisterLegalPairs,
} from '../scripts/highOblique/equalHeightSocketRegisterAudit';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
} from '../scripts/walls/equalHeightImporter';
import { composeWallShapes } from '../src/core/compositor';
import { defaultProject } from '../src/data/defaults';
import type { ShapeSpec } from '../src/core/types';

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

let acceptedFrames: CompiledEqualHeightFrame[];
let candidateFrames: CalibratedEqualHeightFrame[];
let initialSourceState: 'legacy-68' | 'accepted-112';

beforeAll(async () => {
  acceptedFrames = await compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  initialSourceState =
    equalHeightAllMaskSourceFootprintState(acceptedFrames);
  candidateFrames = compileSelectedEqualHeightAllMaskFrames(acceptedFrames);
}, 30_000);

function selected112() {
  const result = EQUAL_HEIGHT_FOOTPRINT_PROFILES.find(
    ({ id }) => id === 'candidate-112',
  );
  if (!result) throw new Error('Missing selected 112 px profile');
  return result;
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

type EdgeProfiles = {
  readonly n: Uint8Array;
  readonly e: Uint8Array;
  readonly s: Uint8Array;
  readonly w: Uint8Array;
};

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

/**
 * Render a frame bank as one atlas rather than one native Resvg allocation per
 * cell. The safe-test runner measures native tree RSS, so this keeps the
 * exhaustive all-47 edge proof inside the repository's containment budget.
 */
function edgeProfilesAt(
  frames: readonly { readonly shapes: readonly ShapeSpec[] }[],
  indices: readonly number[],
  size: number,
): ReadonlyMap<number, EdgeProfiles> {
  const project = defaultProject();
  const wall = project.walls.find(({ id }) => id === 'wall-office');
  if (!wall) throw new Error('Default project is missing wall-office');
  const columns = Math.ceil(Math.sqrt(indices.length));
  const rows = Math.ceil(indices.length / columns);
  const width = columns * size;
  const height = rows * size;
  const cells = indices.map((index, position) => {
    const x = (position % columns) * size;
    const y = Math.floor(position / columns) * size;
    const inner = stripSvgShell(
      composeWallShapes(
        frames[index].shapes,
        wall,
        project.style,
        size,
      ),
    );
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      `viewBox="0 0 128 128" overflow="hidden">${inner}</svg>`
    );
  });
  const pixels = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" ` +
      `height="${height}" viewBox="0 0 ${width} ${height}">` +
      `${cells.join('')}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render().pixels;

  return new Map(indices.map((index, position) => {
    const tileX = (position % columns) * size;
    const tileY = Math.floor(position / columns) * size;
    const edge = (
      coordinate: (offset: number) => [number, number],
    ): Uint8Array => {
      const values = new Uint8Array(size);
      for (let offset = 0; offset < size; offset += 1) {
        const [x, y] = coordinate(offset);
        values[offset] =
          pixels[((tileY + y) * width + tileX + x) * 4 + 3] > 0
            ? 1
            : 0;
      }
      return values;
    };
    return [index, {
      n: edge((offset) => [offset, 0]),
      e: edge((offset) => [size - 1, offset]),
      s: edge((offset) => [offset, size - 1]),
      w: edge((offset) => [0, offset]),
    }];
  }));
}

describe('QuotaCo selected 112 px all-47 footprint review bank', () => {
  it('classifies all 47 accepted frames by their source-owned material axis', () => {
    expect(EQUAL_HEIGHT_ALL_MASK_X_ONLY).toEqual([1, 4, 5, 24, 42]);
    expect(EQUAL_HEIGHT_ALL_MASK_Y_ONLY).toEqual([2, 8, 10, 31, 38]);
    expect(EQUAL_HEIGHT_ALL_MASK_IDENTITY).toEqual([46]);

    const counts = { x: 0, y: 0, both: 0, identity: 0 };
    for (let index = 0; index < 47; index += 1) {
      counts[equalHeightAllMaskWarpMode(index)] += 1;
    }
    expect(counts).toEqual({
      x: 5,
      y: 5,
      both: 36,
      identity: 1,
    });
    expect(EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY).toEqual({
      reviewOnly: false,
      selectedProfile: 'candidate-112',
      acceptedSourceState: 'accepted-112',
      acceptedSourceMutation: true,
      ledgerMutation: false,
      exporterIntegration: false,
      atlasMutation: false,
      schemaMutation: false,
      blobMutation: false,
      unityMutation: false,
    });
  });

  it('uses conjugate high and low frontage anchors for accepted mirrors', () => {
    expect(
      warpEqualHeightAllMaskCoordinate(56, 'high-frontage'),
    ).toBeCloseTo(11.5, 6);
    expect(
      warpEqualHeightAllMaskCoordinate(123.5, 'high-frontage'),
    ).toBe(123.5);
    expect(
      warpEqualHeightAllMaskCoordinate(72, 'low-frontage'),
    ).toBeCloseTo(116.5, 6);
    expect(
      warpEqualHeightAllMaskCoordinate(4.5, 'low-frontage'),
    ).toBe(4.5);

    for (const value of [0, 4.5, 16, 56, 72, 96, 123.5, 128]) {
      const directThenMirror =
        128 - warpEqualHeightAllMaskCoordinate(
          128 - value,
          'high-frontage',
        );
      expect(
        warpEqualHeightAllMaskCoordinate(value, 'low-frontage'),
        `x=${value}`,
      ).toBeCloseTo(directThenMirror, 8);
    }
  });

  it('detects legacy and accepted source banks and rejects a partial migration', () => {
    const withAnchor = (
      index: 5 | 10 | 30 | 37,
      shapeIndex: number,
      d: string,
    ): CompiledEqualHeightFrame[] => acceptedFrames.map((frame) =>
      frame.index !== index
        ? frame
        : {
            ...frame,
            shapes: frame.shapes.map((shape, candidateIndex) =>
              candidateIndex === shapeIndex ? { ...shape, d } : shape,
            ),
          },
    );
    const bank = (
      values: readonly [string, string, string, string],
    ): CompiledEqualHeightFrame[] => {
      let result = withAnchor(5, 5, values[0]);
      const apply = (
        frames: CompiledEqualHeightFrame[],
        index: 10 | 30 | 37,
        shapeIndex: number,
        d: string,
      ): CompiledEqualHeightFrame[] => frames.map((frame) =>
        frame.index !== index
          ? frame
          : {
              ...frame,
              shapes: frame.shapes.map((shape, candidateIndex) =>
                candidateIndex === shapeIndex ? { ...shape, d } : shape,
              ),
            },
      );
      result = apply(result, 10, 4, values[1]);
      result = apply(result, 30, 0, values[2]);
      return apply(result, 37, 0, values[3]);
    };
    const legacy = bank([
      'M56 0',
      'M0 56',
      'M56 0',
      'M72 0',
    ]);
    const accepted = bank([
      'M11.5 0',
      'M0 11.5',
      'M11.5 0',
      'M116.5 0',
    ]);
    expect(equalHeightAllMaskSourceFootprintState(legacy)).toBe('legacy-68');
    expect(equalHeightAllMaskSourceFootprintState(accepted)).toBe(
      'accepted-112',
    );
    expect(equalHeightAllMaskSourceFootprintState(candidateFrames)).toBe(
      'accepted-112',
    );
    const mixed = bank([
      'M11.5 0',
      'M0 56',
      'M56 0',
      'M72 0',
    ]);
    expect(() => equalHeightAllMaskSourceFootprintState(mixed)).toThrow(
      /mixed or unknown/,
    );
  });

  it('compiles exactly 47 selected frames without changing blob order or provenance', () => {
    expect(candidateFrames).toHaveLength(47);
    expect(candidateFrames.map(({ id }) => id)).toEqual(
      Array.from({ length: 47 }, (_, index) => `mask_${index}`),
    );
    for (let index = 0; index < 47; index += 1) {
      const accepted = acceptedFrames[index];
      const candidate = candidateFrames[index];
      expect(candidate.index).toBe(accepted.index);
      expect(candidate.canonicalMask).toBe(accepted.canonicalMask);
      expect(candidate.source).toEqual(accepted.source);
      expect(candidate.sourceFiles).toEqual(accepted.sourceFiles);
      expect(candidate.flipXForEastPresentation).toBe(
        accepted.flipXForEastPresentation,
      );
      expect(candidate.shapes).toHaveLength(accepted.shapes.length);
      expect(candidate.footprintCalibration).toMatchObject({
        profileId: 'candidate-112',
        targetThickness: 112,
        sourceFootprintState: initialSourceState,
        transformApplied: initialSourceState === 'legacy-68',
        ...equalHeightAllMaskCalibration(accepted),
      });
    }
  });

  it('keeps paint order and metadata fixed while changing only candidate paths', () => {
    for (let index = 0; index < 47; index += 1) {
      const accepted = acceptedFrames[index];
      const candidate = candidateFrames[index];
      if (index === 46 || initialSourceState === 'accepted-112') {
        expect(candidate.shapes).toBe(accepted.shapes);
        continue;
      }
      expect(candidate.shapes).not.toBe(accepted.shapes);
      for (let shapeIndex = 0; shapeIndex < accepted.shapes.length; shapeIndex += 1) {
        const sourceShape = accepted.shapes[shapeIndex];
        const candidateShape = candidate.shapes[shapeIndex];
        expect({ ...candidateShape, d: sourceShape.d }).toEqual(sourceShape);
      }
    }
  });

  it('contains warped stroke centers without moving fill-only geometry', () => {
    if (initialSourceState === 'accepted-112') {
      expect(candidateFrames[3].shapes).toBe(acceptedFrames[3].shapes);
      return;
    }
    const seam = candidateFrames[3].shapes[22];
    expect(seam.strokeWidth).toBe(1.5);
    expect(seam.d).toMatch(/^M71\.233 0\.75/);
    expect(seam.d).toMatch(/L127 23\.115$/);
    expect(candidateFrames[30].shapes[16].d).toContain('M0.75 11.5');
    expect(candidateFrames[30].shapes[16].d).toContain('L14.819 0.75');

    const fill = acceptedFrames[3].shapes[10];
    expect(fill.strokeWidth).toBeUndefined();
    expect(candidateFrames[3].shapes[10].d).toBe(
      warpEqualHeightAllMaskPath(
        fill.d,
        equalHeightAllMaskCalibration(acceptedFrames[3]),
      ),
    );
  });

  it('matches the owner-selected 112 px envelope on its four representatives', () => {
    const profile = selected112();
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    expect(wall).toBeDefined();
    const axes = {
      5: 'x',
      6: 'both',
      8: 'y',
      10: 'y',
    } as const;
    for (const [maskText, axis] of Object.entries(axes)) {
      const mask = Number(maskText);
      const proofShapes = calibrateEqualHeightFootprintShapes(
        acceptedFrames[mask].shapes,
        axis,
        profile,
        initialSourceState,
      );
      const candidatePixels = new Resvg(
        composeWallShapes(
          candidateFrames[mask].shapes,
          wall!,
          project.style,
          128,
        ),
        { font: { loadSystemFonts: false } },
      ).render().pixels;
      const proofPixels = new Resvg(
        composeWallShapes(proofShapes, wall!, project.style, 128),
        { font: { loadSystemFonts: false } },
      ).render().pixels;
      const alphaBounds = (pixels: Uint8Array) => {
        let minX = 128;
        let minY = 128;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < 128; y += 1) {
          for (let x = 0; x < 128; x += 1) {
            if (pixels[(y * 128 + x) * 4 + 3] === 0) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
        return { minX, minY, maxX, maxY };
      };
      expect(alphaBounds(candidatePixels), `mask_${mask}`).toEqual(
        alphaBounds(proofPixels),
      );
    }
  });

  it('preserves plain whole-cell X derivations after candidate calibration', () => {
    const plainMirrorPairs = [
      [6, 12],
      [20, 26],
      [23, 29],
      [25, 43],
      [33, 45],
      [41, 44],
    ] as const;
    for (const [directIndex, mirrorIndex] of plainMirrorPairs) {
      expect(
        candidateFrames[mirrorIndex].shapes.map(mirrorShapeX),
        `mask_${directIndex}/mask_${mirrorIndex}`,
      ).toEqual(candidateFrames[directIndex].shapes);
    }
  });

  it('rephases the mixed S-union without shearing its local wall stacks', () => {
    expect(() =>
      warpEqualHeightAllMaskPath(
        acceptedFrames[30].shapes[0].d,
        equalHeightAllMaskCalibration(acceptedFrames[30]),
      ),
    ).toThrow(/source-owned S-union compiler/);
    expect(candidateFrames[30].shapes[0].d).toBe(
      'M11.5 0L128 0 128 79.53 118.554 79.53' +
      'C117.419 79.53 116.5 86.958 116.5 96.122' +
      'L116.5 128 0 128 0 11.5 9.446 11.5' +
      'C10.581 11.5 11.5 10.581 11.5 9.446Z',
    );
    expect(candidateFrames[30].shapes[10].d).toBe(
      'M70 64.596L128 64.596 128 74.552 70 74.552Z',
    );
    expect(candidateFrames[30].shapes[13].d).toBe(
      'M59.256 105L113.181 105 113.181 126 59.256 126Z',
    );

    const filteredMirror = candidateFrames[30].shapes
      .filter((_, index) => index !== 4 && index !== 18)
      .map(mirrorShapeX);
    expect(candidateFrames[40].shapes).toEqual(filteredMirror);
  });

  it('is byte-stable and leaves the accepted frame bank untouched', () => {
    const acceptedBefore = JSON.stringify(acceptedFrames);
    const first = compileSelectedEqualHeightAllMaskFrames(acceptedFrames);
    const second = compileSelectedEqualHeightAllMaskFrames(acceptedFrames);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(JSON.stringify(acceptedFrames)).toBe(acceptedBefore);
  });

  it('replays an already accepted 112 bank as a byte-identical identity', () => {
    const replay = compileSelectedEqualHeightAllMaskFrames(candidateFrames);
    expect(replay).toHaveLength(47);
    for (let index = 0; index < replay.length; index += 1) {
      expect(replay[index].shapes, `mask_${index}`).toBe(
        candidateFrames[index].shapes,
      );
      expect(replay[index].footprintCalibration).toMatchObject({
        profileId: 'candidate-112',
        targetThickness: 112,
        sourceFootprintState: 'accepted-112',
        transformApplied: false,
      });
    }
  });

  it('keeps the common core of all 338 legal cardinal joins opaque', () => {
    const profiles = edgeProfilesAt(
      candidateFrames,
      candidateFrames.map(({ index }) => index),
      128,
    );
    const edgeAt = (
      index: number,
      edge: keyof EdgeProfiles,
      offset: number,
    ): number => profiles.get(index)![edge][offset];

    const pairs = enumerateEqualHeightSocketRegisterLegalPairs();
    expect(pairs).toHaveLength(338);
    for (const { direction, firstMask, secondMask } of pairs) {
      for (let cross = 32; cross <= 96; cross += 8) {
        if (direction === 'e') {
          expect(
            edgeAt(firstMask, 'e', cross),
            `east mask_${firstMask} -> mask_${secondMask} y=${cross}`,
          ).toBeGreaterThan(0);
          expect(
            edgeAt(secondMask, 'w', cross),
            `west mask_${firstMask} -> mask_${secondMask} y=${cross}`,
          ).toBeGreaterThan(0);
        } else {
          expect(
            edgeAt(firstMask, 's', cross),
            `south mask_${firstMask} -> mask_${secondMask} x=${cross}`,
          ).toBeGreaterThan(0);
          expect(
            edgeAt(secondMask, 'n', cross),
            `north mask_${firstMask} -> mask_${secondMask} x=${cross}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('introduces no new interior alpha-edge mismatch across all 338 joins and representative 4x joins', () => {
    const allPairs = enumerateEqualHeightSocketRegisterLegalPairs();
    const representative4xPairs = [
      { direction: 'e', firstMask: 2, secondMask: 8 },
      { direction: 'e', firstMask: 10, secondMask: 10 },
      { direction: 'e', firstMask: 6, secondMask: 8 },
      { direction: 'e', firstMask: 10, secondMask: 12 },
      { direction: 'e', firstMask: 24, secondMask: 42 },
      { direction: 'e', firstMask: 31, secondMask: 31 },
      { direction: 'e', firstMask: 46, secondMask: 42 },
      { direction: 'e', firstMask: 41, secondMask: 45 },
      { direction: 's', firstMask: 4, secondMask: 1 },
      { direction: 's', firstMask: 5, secondMask: 5 },
      { direction: 's', firstMask: 6, secondMask: 1 },
      { direction: 's', firstMask: 24, secondMask: 16 },
      { direction: 's', firstMask: 31, secondMask: 38 },
      { direction: 's', firstMask: 46, secondMask: 46 },
      { direction: 's', firstMask: 45, secondMask: 41 },
    ] as const;
    for (const [size, pairs] of [
      [128, allPairs],
      [512, representative4xPairs],
    ] as const) {
      const indices = Array.from(new Set(
        pairs.flatMap(({ firstMask, secondMask }) => [
          firstMask,
          secondMask,
        ]),
      ));
      const acceptedProfiles = edgeProfilesAt(
        acceptedFrames,
        indices,
        size,
      );
      const candidateProfiles = edgeProfilesAt(
        candidateFrames,
        indices,
        size,
      );
      let newInteriorMismatchCount = 0;
      const diagnostics: string[] = [];
      for (const { direction, firstMask, secondMask } of pairs) {
        const acceptedFirst = acceptedProfiles.get(firstMask)!;
        const acceptedSecond = acceptedProfiles.get(secondMask)!;
        const candidateFirst = candidateProfiles.get(firstMask)!;
        const candidateSecond = candidateProfiles.get(secondMask)!;
        const acceptedA = direction === 'e'
          ? acceptedFirst.e
          : acceptedFirst.s;
        const acceptedB = direction === 'e'
          ? acceptedSecond.w
          : acceptedSecond.n;
        const candidateA = direction === 'e'
          ? candidateFirst.e
          : candidateFirst.s;
        const candidateB = direction === 'e'
          ? candidateSecond.w
          : candidateSecond.n;
        for (let offset = 0; offset < size; offset += 1) {
          const acceptedMismatch = acceptedA[offset] !== acceptedB[offset];
          const candidateMismatch = candidateA[offset] !== candidateB[offset];
          const normalizedOffset = offset * 128 / size;
          const isInterior =
            normalizedOffset >= 16 && normalizedOffset <= 111;
          if (candidateMismatch && !acceptedMismatch && isInterior) {
            newInteriorMismatchCount += 1;
            if (diagnostics.length < 20) {
              diagnostics.push(
                `${direction}:${firstMask}->${secondMask}@${offset}` +
                `=${candidateA[offset]}/${candidateB[offset]}`,
              );
            }
          }
        }
      }
      expect(
        newInteriorMismatchCount,
        `${size}px edge profiles: ${diagnostics.join(', ')}`,
      ).toBe(0);
    }
  }, 30_000);

  it('widens the mixed-register and east-fixed exceptions on their actual sockets', () => {
    const profiles = edgeProfilesAt(
      candidateFrames,
      [30, 37, 40],
      128,
    );
    const rangeAt = (index: number, y: 0 | 127): [number, number] => {
      const alpha = profiles.get(index)![y === 0 ? 'n' : 's'];
      let min = 128;
      let max = -1;
      for (let x = 0; x < 128; x += 1) {
        if (alpha[x] === 0) continue;
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
      return [min, max];
    };

    expect(candidateFrames[30].footprintCalibration.xOrientation).toBe(
      'mixed-high-to-low',
    );
    expect(candidateFrames[40].footprintCalibration.xOrientation).toBe(
      'mixed-low-to-high',
    );
    expect(candidateFrames[37].footprintCalibration.xOrientation).toBe(
      'low-frontage',
    );
    expect(rangeAt(30, 0)).toEqual([11, 127]);
    expect(rangeAt(30, 127)).toEqual([0, 116]);
    expect(rangeAt(40, 0)).toEqual([0, 116]);
    expect(rangeAt(40, 127)).toEqual([11, 127]);
    expect(rangeAt(37, 0)).toEqual([0, 116]);
    expect(rangeAt(37, 127)).toEqual([4, 116]);
  });
});
