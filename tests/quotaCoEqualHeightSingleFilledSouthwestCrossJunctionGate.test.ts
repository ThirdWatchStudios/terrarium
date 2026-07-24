import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleFilledSouthwestCrossJunctionGate,
  type EqualHeightSingleFilledSouthwestCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleFilledSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const FORBIDDEN_NEW_SOURCE_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/single-filled-southwest-cross-junction',
);

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const sourceBody = (): string =>
  stripSvgShell(
    readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_se-base.svg'),
      'utf8',
    ),
  ) +
  stripSvgShell(
    readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_se-upper.svg'),
      'utf8',
    ),
  );

function rasterCandidate(
  cellPixels: number,
  mirrorX: boolean,
): ReturnType<Resvg['render']> {
  const content = mirrorX
    ? `<g transform="translate(128 0) scale(-1 1)">${sourceBody()}</g>`
    : sourceBody();
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${content}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function alphaRowSpan(
  raster: ReturnType<Resvg['render']>,
  row: number,
): readonly [number, number] {
  const occupied: number[] = [];
  for (let column = 0; column < raster.width; column += 1) {
    if (raster.pixels[(row * raster.width + column) * 4 + 3] > 0) {
      occupied.push(column);
    }
  }
  if (occupied.length === 0) throw new Error(`No alpha at raster row ${row}`);
  return [occupied[0], occupied[occupied.length - 1]];
}

function alphaColumnSpan(
  raster: ReturnType<Resvg['render']>,
  column: number,
): readonly [number, number] {
  const occupied: number[] = [];
  for (let row = 0; row < raster.height; row += 1) {
    if (raster.pixels[(row * raster.width + column) * 4 + 3] > 0) {
      occupied.push(row);
    }
  }
  if (occupied.length === 0) {
    throw new Error(`No alpha at raster column ${column}`);
  }
  return [occupied[0], occupied[occupied.length - 1]];
}

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
): EqualHeightSingleFilledSouthwestCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
  const occupied = (column: number, row: number): boolean =>
    row >= 0 && row < rows && column >= 0 && column < columns &&
    pattern[row][column] === '#';
  return pattern.map((row, rowIndex) =>
    [...row].map((cell, columnIndex) => {
      if (cell !== '#') return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(columnIndex + dx, rowIndex + dy)) raw |= bit;
      }
      return blobIndex(raw);
    })) as EqualHeightSingleFilledSouthwestCrossJunctionMatrix;
}

const singleFilledSouthwestCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (column === armLength - 1 && row === armLength + 1)
        ? '#'
        : '.').join(''));
};

describe('QuotaCo accepted single-filled southwest cross-junction gate', () => {
  it('locks mask_29 as the accepted whole-cell X mirror of mask_23', () => {
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-single-filled-southwest-cross-junction-gate',
        version: 0,
        status: 'owner-accepted-single-filled-southwest-cross-junction-gate',
        contract: false,
        topologyClass: 'single-filled-southwest-cross-junction',
        candidate: {
          maskIndex: 29,
          sourceMaskIndex: 23,
          sourceStem: 'open_cross_filled_se',
          baseFile: 'open_cross_filled_se-base.svg',
          upperFile: 'open_cross_filled_se-upper.svg',
          connectedEdges: ['n', 'e', 's', 'w'],
          openPockets: ['ne', 'se', 'nw'],
          solidDiagonals: ['sw'],
          fixedLightRole: 'rear-southwest-filled-four-way-hub',
          transform: 'mirror-x',
          derivation: 'none',
          resolution: 'approved-derivation',
        },
        baselineMaskRows: [15, 23, 27, 28],
        installedNeighborMaskRows: [
          1, 2, 4, 5, 8, 10, 16, 20, 22, 34, 36,
        ],
        maskRowsUnderReview: [],
        maskRowsAccepted: [29],
        reviewCellSizes: [240, 90, 40],
        reviewArmLengths: [1, 3, 6],
        xMirrorAllowed: true,
        yMirrorAllowed: false,
        rotationAllowed: false,
        productionRegistration: false,
        productionTopologyMutation: false,
        schemaChange: false,
        exportable: false,
        committedAtlas: false,
        temporaryFrameIds: true,
      });
    expect(BLOB_CONFIGS[23]).toBe(0x2f);
    expect(BLOB_CONFIGS[29]).toBe(0x4f);
    expect(configForIndex(29)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'concave',
      sw: 'solid',
      nw: 'concave',
    });
    expect(
      () => validateEqualHeightSingleFilledSouthwestCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-cell matrices from the southwest-filled occupancy', () => {
    expect(singleFilledSouthwestCrossPattern(1)).toEqual([
      '.#.',
      '###',
      '##.',
    ]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .compactMatrix,
    ).toEqual(matrixFor(singleFilledSouthwestCrossPattern(1)));
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .threeCellArmMatrix,
    ).toEqual(matrixFor(singleFilledSouthwestCrossPattern(3)));
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .sixCellArmMatrix,
    ).toEqual(matrixFor(singleFilledSouthwestCrossPattern(6)));
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .compactMatrix,
    ).toEqual([
      [null, 4, null],
      [20, 29, 8],
      [16, 34, null],
    ]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .threeCellArmMatrix[3],
    ).toEqual([2, 10, 22, 29, 10, 10, 8]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .sixCellArmMatrix[7],
    ).toEqual([
      null, null, null, null, null, 16, 36,
      null, null, null, null, null, null,
    ]);
  });

  it('reuses the accepted mask_23 source as one exact X mirror at every review size', () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ]);
    expect(existsSync(FORBIDDEN_NEW_SOURCE_DIRECTORY)).toBe(false);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .renderingDecision,
    ).toMatchObject({
      kind: 'accepted-plain-whole-cell-x-mirror',
      scope: 'external-proof-source-reuse',
      sourceDirectory: SOURCE_PREFIX,
      reusedSourceFiles: [
        'open_cross_filled_se-base.svg',
        'open_cross_filled_se-upper.svg',
      ],
      newAuthoredSourceFiles: [],
      sourceCanvas: 128,
      mirrorAxisX: 64,
      mirrorPolicy: 'whole-cell-x-no-filter',
    });

    for (const cellPixels of [240, 90, 40] as const) {
      const candidate = rasterCandidate(cellPixels, true);
      expect([candidate.width, candidate.height]).toEqual([
        cellPixels,
        cellPixels,
      ]);
      expect(
        candidate.pixels.some(
          (channel, offset) => offset % 4 === 3 && channel > 0,
        ),
      ).toBe(true);
    }

    const candidate = rasterCandidate(128, true);
    expect(alphaRowSpan(candidate, 0)).toEqual([4, 71]);
    expect(alphaRowSpan(candidate, 127)).toEqual([0, 81]);
    expect(alphaColumnSpan(candidate, 0)).toEqual([56, 127]);
    expect(alphaColumnSpan(candidate, 127)).toEqual([56, 123]);
  });

  it('promotes mask_29 as the accepted whole-cell X derivation of mask_23', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[23]).toMatchObject({
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_cross_filled_se',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[29]).toMatchObject({
      id: 'mask_29',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'se', 'nw'],
      solidDiagonals: ['sw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-filled-southwest-cross-junction',
          sourceStem: 'open_cross_filled_se',
          transform: 'mirror-x',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 27,
      'approved-derivation': 18,
    'synthetic-assembly': 2,
      'unresolved-authored-geometry': 0,
    });
  });

  it('renders through its own workbench status key without changing source art', () => {
    const styleLoop = readFileSync(
      path.resolve(process.cwd(), 'scripts/styleLoop.ts'),
      'utf8',
    );
    expect(styleLoop).toContain(
      "import {\n  EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE,\n} from './highOblique/equalHeightSingleFilledSouthwestCrossJunctionGate';",
    );
    expect(styleLoop).toContain(
      'await renderEqualHeightSingleFilledSouthwestCrossJunctionGate(',
    );
    expect(styleLoop).toContain(
      'singleFilledSouthwestCrossJunctionRenderedAt: renderedAt',
    );
    expect(styleLoop).toContain(
      'status.singleFilledSouthwestCrossJunctionRenderedAt = renderedAt',
    );
    expect(styleLoop).toContain(
      'candidate.baseFile,\n    candidate.upperFile,\n    candidate.transform',
    );
  });

  it('rejects transform, matrix, acceptance, and production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightSingleFilledSouthwestCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'none',
        },
      } as unknown as typeof gate)).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleFilledSouthwestCrossJunctionGate({
        ...gate,
        compactMatrix: [[29]] as const,
      } as unknown as typeof gate)).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightSingleFilledSouthwestCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [29] as const,
        maskRowsAccepted: [] as const,
      } as unknown as typeof gate)).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleFilledSouthwestCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate)).toThrow(/proof-only production boundary/);
  });
});
