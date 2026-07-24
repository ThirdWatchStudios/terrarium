import { describe, expect, it } from 'vitest';

import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  doubleFilledDiagonalCrossJunctionVerticalFacing,
  EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledDiagonalCrossJunctionGate,
  type EqualHeightDoubleFilledDiagonalCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightOpenPocketCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE } from '../scripts/highOblique/equalHeightSingleFilledSouthwestCrossJunctionGate';
import { wallAtlas } from '../src/core/exporter';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { WALL_TEMPLATES } from '../src/tiles/templates';

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

/** Derive canonical mask indices from literal occupied cells. */
function matrixFor(
  pattern: readonly string[],
): EqualHeightDoubleFilledDiagonalCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
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
    })) as EqualHeightDoubleFilledDiagonalCrossJunctionMatrix;
}

const doubleFilledDiagonalCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  const center = armLength;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      row === center ||
      column === center ||
      (column === center + 1 && row === center - 1) ||
      (column === center - 1 && row === center + 1)
        ? '#'
        : '.',
    ).join(''),
  );
};

describe('QuotaCo accepted double-filled diagonal cross-junction gate', () => {
  it('locks mask_30 as the opposed northeast/southwest accepted topology', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem: 'equal-height-double-filled-diagonal-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-double-filled-diagonal-cross-junction-gate',
      contract: false,
      topologyClass: 'double-filled-diagonal-cross-junction',
      candidate: {
        maskIndex: 30,
        sourceMaskIndex: 30,
        sourceStem: 'open_cross_filled_ne_sw',
        baseFile: 'open_cross_filled_ne_sw-base.svg',
        upperFile: 'open_cross_filled_ne_sw-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['se', 'nw'],
        solidDiagonals: ['ne', 'sw'],
        fixedLightRole: 'opposed-ne-sw-filled-four-way-hub',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [15, 19, 29],
      installedNeighborMaskRows: [
        1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 35, 36,
      ],
      maskRowsUnderReview: [],
      maskRowsAccepted: [30],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      renderingDecision: {
        verticalRegisterPolicy: {
          north: 'west',
          south: 'east',
        },
      },
      directSourceAccepted: true,
      xMirrorAllowed: false,
      yMirrorAllowed: false,
      rotationAllowed: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
      temporaryFrameIds: true,
    });
    expect(BLOB_CONFIGS[30]).toBe(0x5f);
    expect(configForIndex(30)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'solid',
      nw: 'concave',
    });
    expect(
      () => validateEqualHeightDoubleFilledDiagonalCrossJunctionGate(),
    ).not.toThrow();
  });

  it('keeps the upper arm west-authored and the lower arm east-mirrored', () => {
    expect(
      Array.from({ length: 7 }, (_, row) =>
        doubleFilledDiagonalCrossJunctionVerticalFacing(row, 7),
      ),
    ).toEqual([
      'west',
      'west',
      'west',
      'west',
      'east',
      'east',
      'east',
    ]);
    expect(
      doubleFilledDiagonalCrossJunctionVerticalFacing(12, 13),
    ).toBe('east');
    expect(() =>
      doubleFilledDiagonalCrossJunctionVerticalFacing(0, 6),
    ).toThrow(/odd matrix/);
  });

  it('derives the compact and 3/6-cell evidence from exact occupancy', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE;
    expect(doubleFilledDiagonalCrossPattern(1)).toEqual([
      '.##',
      '###',
      '##.',
    ]);
    expect(gate.compactMatrix).toEqual(
      matrixFor(doubleFilledDiagonalCrossPattern(1)),
    );
    expect(gate.threeCellArmMatrix).toEqual(
      matrixFor(doubleFilledDiagonalCrossPattern(3)),
    );
    expect(gate.sixCellArmMatrix).toEqual(
      matrixFor(doubleFilledDiagonalCrossPattern(6)),
    );
    expect(gate.compactMatrix).toEqual([
      [null, 20, 26],
      [20, 30, 34],
      [16, 34, null],
    ]);
    expect(gate.threeCellArmMatrix).toEqual([
      [null, null, null, 4, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 21, 26, null, null],
      [2, 10, 22, 30, 35, 10, 8],
      [null, null, 16, 36, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(gate.sixCellArmMatrix[5]).toEqual([
      null, null, null, null, null, null, 21,
      26, null, null, null, null, null,
    ]);
    expect(gate.sixCellArmMatrix[6]).toEqual([
      2, 10, 10, 10, 10, 22, 30, 35, 10, 10, 10, 10, 8,
    ]);
    expect(gate.sixCellArmMatrix[7]).toEqual([
      null, null, null, null, null, 16, 36,
      null, null, null, null, null, null,
    ]);

    const installedMasks = new Set(
      [
        ...gate.compactMatrix.flat(),
        ...gate.threeCellArmMatrix.flat(),
        ...gate.sixCellArmMatrix.flat(),
      ]
        .filter((index): index is number => index !== null),
    );
    installedMasks.delete(30);
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 35, 36,
    ]);
  });

  it('uses accepted masks 15, 19, and 29 as cues for one direct row 30 source', () => {
    expect(
      EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.maskRowsAccepted,
    ).toEqual([15]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.maskRowsAccepted,
    ).toEqual([19]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE
        .maskRowsAccepted,
    ).toEqual([29]);

    for (const index of [15, 19, 29] as const) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[30]).toMatchObject({
      id: 'mask_30',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['se', 'nw'],
      solidDiagonals: ['ne', 'sw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-diagonal-cross-junction',
          sourceStem: 'open_cross_filled_ne_sw',
          baseFile: 'open_cross_filled_ne_sw-base.svg',
          upperFile: 'open_cross_filled_ne_sw-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 16,
      'synthetic-assembly': 7,
      'unresolved-authored-geometry': 0,
    });
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .acceptedLedgerCounts,
    ).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('accepts one flattened source instead of stacked control provenance', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision,
    ).toMatchObject({
      kind: 'one-accepted-authored-double-filled-diagonal-four-way-hub',
      scope: 'external-proof-source-bank',
      sourceDirectory:
        'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction',
      authoredSourceFiles: [
        'open_cross_filled_ne_sw-base.svg',
        'open_cross_filled_ne_sw-upper.svg',
      ],
      sourceCanvas: 128,
      sourceAuthorship: 'flattened-fixed-view-no-transform',
      geometryCueMaskIndices: [15, 19, 29],
      sourceRelationship: 'authored-cues-only-no-derived-provenance',
      verticalRegisterPolicy: {
        north: 'west',
        south: 'east',
      },
    });
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision.composition,
    ).toMatch(/one flattened/);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision.requiredRead,
    ).toMatch(/never a filled block, diagonal badge, peak, patch, or post/);
  });

  it('rejects demotion, occupancy, transform, and production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightDoubleFilledDiagonalCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [30] as const,
        maskRowsAccepted: [] as const,
        directSourceAccepted: false,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledDiagonalCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'mirror-x',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledDiagonalCrossJunctionGate({
        ...gate,
        compactMatrix: [[30]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightDoubleFilledDiagonalCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/accepted proof-layer boundary/);
  });

  it('does not mutate blob, templates, exporter, or authored production surfaces', () => {
    const sourceStem =
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .candidate.sourceStem;
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(BLOB_CONFIGS[30]).toBe(0x5f);
    expect(A1B_AUTHORED_STEMS).not.toContain(sourceStem);
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(sourceStem);
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
