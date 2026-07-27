import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleOpenSoutheastCrossJunctionGate,
  type EqualHeightSingleOpenSoutheastCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleOpenSoutheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleOpenSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { WALL_TEMPLATES } from '../src/tiles/templates';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/single-open-southwest-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const NEIGHBORS = [
  [NB.N, 0, -1],
  [NB.E, 1, 0],
  [NB.S, 0, 1],
  [NB.W, -1, 0],
  [NB.NE, 1, -1],
  [NB.SE, 1, 1],
  [NB.SW, -1, 1],
  [NB.NW, -1, -1],
] as const;

function matrixFor(
  pattern: readonly string[],
): EqualHeightSingleOpenSoutheastCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  const occupied = (column: number, row: number): boolean =>
    row >= 0 &&
    row < rows &&
    column >= 0 &&
    column < columns &&
    pattern[row][column] === '#';
  return pattern.map((row, rowIndex) =>
    [...row].map((cell, columnIndex) => {
      if (cell !== '#') return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(columnIndex + dx, rowIndex + dy)) raw |= bit;
      }
      return blobIndex(raw);
    })) as EqualHeightSingleOpenSoutheastCrossJunctionMatrix;
}

const patternFor = (armLength: number): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (row === armLength - 1 &&
        (column === armLength - 1 || column === armLength + 1)) ||
      (row === armLength + 1 && column === armLength - 1)
        ? '#'
        : '.',
    ).join(''),
  );
};

function rasterCandidate(
  cellPixels: number,
  background: '#A8A28F' | '#252A28',
  transform: 'none' | 'mirror-x',
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne_se_nw-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne_se_nw-upper.svg'));
  const transformedBody = transform === 'mirror-x'
    ? `<g transform="translate(128 0) scale(-1 1)">${body}</g>`
    : body;
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/>${transformedBody}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function mirrorDistance(
  direct: ReturnType<Resvg['render']>,
  candidate: ReturnType<Resvg['render']>,
): {
  readonly differingChannelRatio: number;
  readonly meanAbsoluteChannelDistance: number;
  readonly maximumChannelDistance: number;
} {
  const directPixels = direct.pixels;
  const candidatePixels = candidate.pixels;
  let differingChannels = 0;
  let totalDistance = 0;
  let maximumDistance = 0;
  for (let row = 0; row < direct.height; row += 1) {
    for (let column = 0; column < direct.width; column += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        const directOffset =
          (row * direct.width + (direct.width - column - 1)) * 4 + channel;
        const candidateOffset =
          (row * candidate.width + column) * 4 + channel;
        const distance = Math.abs(
          directPixels[directOffset] - candidatePixels[candidateOffset],
        );
        if (distance > 0) differingChannels += 1;
        totalDistance += distance;
        maximumDistance = Math.max(maximumDistance, distance);
      }
    }
  }
  return {
    differingChannelRatio: differingChannels / directPixels.length,
    meanAbsoluteChannelDistance: totalDistance / directPixels.length,
    maximumChannelDistance: maximumDistance,
  };
}

function rgbAt(
  raster: ReturnType<Resvg['render']>,
  normalizedColumn: number,
  normalizedRow: number,
): readonly [number, number, number] {
  const column = Math.floor(normalizedColumn * raster.width);
  const row = Math.floor(normalizedRow * raster.height);
  const offset = (row * raster.width + column) * 4;
  const pixels = raster.pixels;
  return [
    pixels[offset],
    pixels[offset + 1],
    pixels[offset + 2],
  ];
}

function hasOpaqueRgb(
  raster: ReturnType<Resvg['render']>,
  expected: readonly [number, number, number],
  tolerance = 0,
): boolean {
  const pixels = raster.pixels;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (
      Math.abs(pixels[offset] - expected[0]) <= tolerance &&
      Math.abs(pixels[offset + 1] - expected[1]) <= tolerance &&
      Math.abs(pixels[offset + 2] - expected[2]) <= tolerance &&
      pixels[offset + 3] === 255
    ) {
      return true;
    }
  }
  return false;
}

const productionSignature = (): string => {
  const atlas = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
  return JSON.stringify({
    schema: CURRENT_SCHEMA_VERSION,
    blobConfigs: BLOB_CONFIGS,
    authoredStems: A1B_AUTHORED_STEMS,
    wallTemplateIds: WALL_TEMPLATES.map(({ id }) => id),
    atlasFrameIds: Object.keys(atlas.frames),
    mask44Frame: atlas.frames.mask_44,
  });
};

describe('QuotaCo accepted single-open southeast cross-junction gate', () => {
  it('locks mask_44 as the accepted plain whole-cell X mirror of mask_41', () => {
    expect(EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem:
          'equal-height-single-open-southeast-cross-junction-gate',
        status:
          'owner-accepted-single-open-southeast-cross-junction-gate',
        contract: false,
        candidate: {
          maskIndex: 44,
          sourceMaskIndex: 41,
          sourceStem: 'open_cross_filled_ne_se_nw',
          baseFile: 'open_cross_filled_ne_se_nw-base.svg',
          upperFile: 'open_cross_filled_ne_se_nw-upper.svg',
          connectedEdges: ['n', 'e', 's', 'w'],
          openPockets: ['se'],
          solidDiagonals: ['nw', 'ne', 'sw'],
          fixedLightRole: 'single-open-southeast-four-way-hub',
          transform: 'mirror-x',
          derivation: 'none',
          resolution: 'approved-derivation',
        },
        sourceMaskRows: [41],
        maskRowsUnderReview: [],
        maskRowsAccepted: [44],
        reviewCellSizes: [240, 90, 40],
        reviewArmLengths: [1, 3, 6],
        reviewGrounds: ['light', 'dark'],
        sourceGateAccepted: true,
        candidateAccepted: true,
        ledgerPromotion: true,
        xMirrorAllowed: true,
        filteredXMirrorApplied: false,
        productionArtMutation: false,
        productionRegistration: false,
        atlasMutation: false,
        blobMappingMutation: false,
        schemaChange: false,
        unityRegistration: false,
        exportable: false,
      });
    expect(BLOB_CONFIGS[44]).toBe(0xdf);
    expect(configForIndex(44)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'solid',
      nw: 'solid',
    });
    expect(
      () =>
        validateEqualHeightSingleOpenSoutheastCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-cell evidence from literal southeast-open occupancy', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE;
    expect(patternFor(1)).toEqual(['###', '###', '##.']);
    expect(gate.compactMatrix).toEqual(matrixFor(patternFor(1)));
    expect(gate.threeCellArmMatrix).toEqual(matrixFor(patternFor(3)));
    expect(gate.sixCellArmMatrix).toEqual(matrixFor(patternFor(6)));
    expect(gate.compactMatrix).toEqual([
      [20, 31, 26],
      [24, 44, 34],
      [16, 34, null],
    ]);
    expect(gate.threeCellArmMatrix).toEqual([
      [null, null, null, 4, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, 20, 32, 26, null, null],
      [2, 10, 25, 44, 35, 10, 8],
      [null, null, 16, 36, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(gate.sixCellArmMatrix).toEqual([
      [null, null, null, null, null, null, 4, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, 20, 32, 26, null, null, null, null, null],
      [2, 10, 10, 10, 10, 25, 44, 35, 10, 10, 10, 10, 8],
      [null, null, null, null, null, 16, 36, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 1, null, null, null, null, null, null],
    ]);
  });

  it('keeps the source and installed neighbors accepted while promoting row 44', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE;
    const installed = new Set([
      ...gate.compactMatrix.flat(),
      ...gate.threeCellArmMatrix.flat(),
      ...gate.sixCellArmMatrix.flat(),
    ].filter((index): index is number => index !== null));
    installed.delete(44);
    expect([...installed].sort((left, right) => left - right)).toEqual(
      gate.installedNeighborMaskRows,
    );
    for (const index of installed) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[41]).toMatchObject({
      id: 'mask_41',
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: gate.candidate.sourceStem,
          baseFile: gate.candidate.baseFile,
          upperFile: gate.candidate.upperFile,
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[44]).toMatchObject({
      id: 'mask_44',
      canonicalMask: 0xdf,
      pockets: ['se'],
      solidDiagonals: ['ne', 'sw', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-open-southeast-cross-junction',
          sourceStem: gate.candidate.sourceStem,
          baseFile: gate.candidate.baseFile,
          upperFile: gate.candidate.upperFile,
          transform: 'mirror-x',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 28,
      'approved-derivation': 19,
      'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
    expect(gate.acceptedLedgerCounts).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('uses the accepted proof files read-only and mirrors their complete raster', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE;
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_ne_se_nw-base.svg',
      'open_cross_filled_ne_se_nw-upper.svg',
    ]);
    expect(gate.renderingDecision).toMatchObject({
      kind: 'accepted-plain-whole-cell-x-mirror',
      scope: 'external-proof-source-reuse',
      sourceGate:
        EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem,
      sourceDirectory: SOURCE_PREFIX,
      reusedSourceFiles:
        EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE
          .renderingDecision.authoredSourceFiles,
      newAuthoredSourceFiles: [],
      sourceCanvas: 128,
      mirrorAxisX: 64,
      mirrorPolicy: 'whole-cell-x-no-filter',
      seamFilter: 'none',
      sourceRelationship:
        'read-only-x-mirror-of-owner-accepted-mask-41-proof-source',
    });
    expect(
      source('open_cross_filled_ne_se_nw-base.svg') +
      source('open_cross_filled_ne_se_nw-upper.svg'),
    ).not.toMatch(/\btransform\s*=/);

    for (const cellPixels of [240, 90, 40] as const) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        const direct = rasterCandidate(cellPixels, background, 'none');
        const candidate = rasterCandidate(
          cellPixels,
          background,
          'mirror-x',
        );
        expect([candidate.width, candidate.height]).toEqual([
          cellPixels,
          cellPixels,
        ]);
        const distance = mirrorDistance(direct, candidate);
        expect(distance.differingChannelRatio).toBeLessThanOrEqual(0.016);
        expect(distance.meanAbsoluteChannelDistance)
          .toBeLessThanOrEqual(0.26);
        expect(distance.maximumChannelDistance).toBeLessThanOrEqual(70);
        expect(hasOpaqueRgb(candidate, [217, 208, 185])).toBe(true);
        expect(
          hasOpaqueRgb(
            candidate,
            [182, 95, 77],
            cellPixels === 40 ? 3 : 0,
          ),
        ).toBe(true);
        expect(
          hasOpaqueRgb(
            candidate,
            [41, 75, 60],
            cellPixels === 40 ? 4 : 0,
          ),
        ).toBe(true);
        if (background === '#A8A28F') {
          expect(rgbAt(candidate, 0.98, 0.98)).toEqual([168, 162, 143]);
          expect(rgbAt(candidate, 0.02, 0.98)).not.toEqual([168, 162, 143]);
        }
      }
    }
  });

  it('rejects topology, source, matrix, filter, and demotion drift', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightSingleOpenSoutheastCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          sourceMaskIndex: 40,
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenSoutheastCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'none',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenSoutheastCrossJunctionGate({
        ...gate,
        compactMatrix: [[44]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightSingleOpenSoutheastCrossJunctionGate({
        ...gate,
        filteredXMirrorApplied: true,
      } as unknown as typeof gate),
    ).toThrow(/proof-only production boundary/);
    expect(() =>
      validateEqualHeightSingleOpenSoutheastCrossJunctionGate({
        ...gate,
        candidateAccepted: false,
        ledgerPromotion: false,
        maskRowsUnderReview: [44] as const,
        maskRowsAccepted: [] as const,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
  });

  it('leaves the production/export/schema/blob signature unchanged', () => {
    const before = productionSignature();
    validateEqualHeightSingleOpenSoutheastCrossJunctionGate();
    expect(productionSignature()).toBe(before);
    expect(CURRENT_SCHEMA_VERSION).toBe(19);
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(A1B_AUTHORED_STEMS).not.toContain(
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE
        .candidate.sourceStem,
    );
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(
      EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE
        .candidate.sourceStem,
    );
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
