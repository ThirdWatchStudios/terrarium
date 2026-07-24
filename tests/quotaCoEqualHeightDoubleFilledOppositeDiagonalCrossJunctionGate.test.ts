import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
} from '../scripts/highOblique/equalHeightDoubleFilledDiagonalCrossJunctionGate';
import {
  doubleFilledOppositeDiagonalCrossJunctionVerticalFacing,
  EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate,
  type EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledOppositeDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
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

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

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

function matrixForAcceptedOccupancy(
  armLength: 1 | 3 | 6,
): EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center &&
      row >= 0 &&
      row < size) ||
    (row === center &&
      column >= 0 &&
      column < size) ||
    (column === center - 1 && row === center - 1) ||
    (column === center + 1 && row === center + 1);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw);
    }),
  ) as EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix;
}

const oppositeDiagonalCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  const center = armLength;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      row === center ||
      column === center ||
      (column === center - 1 && row === center - 1) ||
      (column === center + 1 && row === center + 1)
        ? '#'
        : '.',
    ).join(''),
  );
};

describe('QuotaCo accepted double-filled opposite diagonal cross-junction gate', () => {
  it('locks mask_40 as the filtered mirror derivation of accepted mask_30', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem:
        'equal-height-double-filled-opposite-diagonal-cross-junction-gate',
      version: 0,
      status:
        'owner-accepted-double-filled-opposite-diagonal-cross-junction-gate',
      contract: false,
      topologyClass: 'double-filled-opposite-diagonal-cross-junction',
      candidate: {
        maskIndex: 40,
        sourceMaskIndex: 30,
        sourceStem: 'open_cross_filled_ne_sw',
        baseFile: 'open_cross_filled_ne_sw-base.svg',
        upperFile: 'open_cross_filled_ne_sw-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['ne', 'sw'],
        solidDiagonals: ['se', 'nw'],
        fixedLightRole: 'opposed-nw-se-filled-four-way-hub',
        transform: 'mirror-x',
        derivation:
          'accepted-opposite-diagonal-boundary-seam-filter',
        resolution: 'approved-derivation',
        acceptedVariant: 'boundary-seam-filtered-mirror',
        sourceOmissions: [
          'base-boundary-seam',
          'upper-boundary-seam',
        ],
      },
      baselineMaskRows: [23, 30, 37],
      maskRowsUnderReview: [],
      maskRowsAccepted: [40],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      acceptedVariant: 'boundary-seam-filtered-mirror',
      sourceMappingAccepted: true,
      derivationAccepted: true,
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
    expect(BLOB_CONFIGS[30]).toBe(0x5f);
    expect(BLOB_CONFIGS[40]).toBe(0xaf);
    expect(configForIndex(40)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'concave',
      nw: 'solid',
    });
    expect(
      () =>
        validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate(),
    ).not.toThrow();
  });

  it('keeps the mirrored north arm east-register and lower arm west-register', () => {
    expect(
      Array.from({ length: 7 }, (_, row) =>
        doubleFilledOppositeDiagonalCrossJunctionVerticalFacing(row, 7),
      ),
    ).toEqual([
      'east',
      'east',
      'east',
      'east',
      'west',
      'west',
      'west',
    ]);
    expect(
      doubleFilledOppositeDiagonalCrossJunctionVerticalFacing(12, 13),
    ).toBe('west');
    expect(() =>
      doubleFilledOppositeDiagonalCrossJunctionVerticalFacing(0, 6),
    ).toThrow(/odd matrix/);
  });

  it('derives compact and 3/6-cell evidence from exact northwest/southeast occupancy', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE;
    expect(oppositeDiagonalCrossPattern(1)).toEqual([
      '##.',
      '###',
      '.##',
    ]);
    expect(gate.compactMatrix).toEqual(
      matrixForAcceptedOccupancy(1),
    );
    expect(gate.threeCellArmMatrix).toEqual(
      matrixForAcceptedOccupancy(3),
    );
    expect(gate.sixCellArmMatrix).toEqual(
      matrixForAcceptedOccupancy(6),
    );
    expect(gate.compactMatrix).toEqual([
      [20, 26, null],
      [16, 40, 26],
      [null, 16, 34],
    ]);
    expect(gate.threeCellArmMatrix[2]).toEqual([
      null, null, 20, 27, null, null, null,
    ]);
    expect(gate.threeCellArmMatrix[3]).toEqual([
      2, 10, 18, 40, 28, 10, 8,
    ]);
    expect(gate.threeCellArmMatrix[4]).toEqual([
      null, null, null, 17, 34, null, null,
    ]);
    expect(gate.sixCellArmMatrix[5]).toEqual([
      null, null, null, null, null, 20, 27,
      null, null, null, null, null, null,
    ]);
    expect(gate.sixCellArmMatrix[6]).toEqual([
      2, 10, 10, 10, 10, 18, 40, 28, 10, 10, 10, 10, 8,
    ]);
    expect(gate.sixCellArmMatrix[7]).toEqual([
      null, null, null, null, null, null, 17,
      34, null, null, null, null, null,
    ]);

    const installedMasks = new Set(
      [
        ...gate.compactMatrix.flat(),
        ...gate.threeCellArmMatrix.flat(),
        ...gate.sixCellArmMatrix.flat(),
      ].filter((index): index is number => index !== null),
    );
    installedMasks.delete(40);
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 16, 17, 18, 20, 26, 27, 28, 34,
    ]);
  });

  it('promotes mask_40 as the accepted filtered X derivation of mask_30', () => {
    const source =
      EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE;
    const candidate =
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE;
    expect(source.maskRowsAccepted).toEqual([30]);
    expect(source.directSourceAccepted).toBe(true);
    expect(source.candidate).toMatchObject({
      maskIndex: 30,
      sourceStem: candidate.candidate.sourceStem,
      baseFile: candidate.candidate.baseFile,
      upperFile: candidate.candidate.upperFile,
      transform: 'none',
      resolution: 'direct-reuse',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[30]).toMatchObject({
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_cross_filled_ne_sw',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[40]).toMatchObject({
      id: 'mask_40',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'sw'],
      solidDiagonals: ['se', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-opposite-diagonal-cross-junction',
          sourceStem: 'open_cross_filled_ne_sw',
          transform: 'mirror-x',
          derivation:
            'accepted-opposite-diagonal-boundary-seam-filter',
        }],
      },
    });
    expect(candidate.acceptedLedgerCounts).toEqual(
      EQUAL_HEIGHT_MASK_LEDGER.counts,
    );
  });

  it('uses the accepted external source bank without adding or rewriting source art', () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_ne_sw-base.svg',
      'open_cross_filled_ne_sw-upper.svg',
    ]);
    const baseSource = readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_ne_sw-base.svg'),
      'utf8',
    );
    const upperSource = readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_ne_sw-upper.svg'),
      'utf8',
    );
    expect(baseSource).toContain('id="base-structural-mass"');
    expect(upperSource).toContain('id="upper-shell"');
    expect(baseSource).toContain('id="base-boundary-seam"');
    expect(upperSource).toContain('id="upper-boundary-seam"');
    const filtered = derivePromotedSoutheastSourcePair(
      baseSource,
      upperSource,
    );
    expect(filtered.baseSource).not.toContain('base-boundary-seam');
    expect(filtered.upperSource).not.toContain('upper-boundary-seam');
    expect(filtered.baseSource).toContain('id="base-structural-mass"');
    expect(filtered.upperSource).toContain('id="upper-shell"');
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE
        .comparisonVariants,
    ).toEqual([
      {
        id: 'raw-whole-cell-mirror-comparison',
        role: 'comparison-control',
        transform: 'mirror-x',
        sourceOmissions: [],
        mirrorPolicy: 'whole-cell-x-no-filter',
      },
      {
        id: 'boundary-seam-filtered-mirror',
        role: 'owner-accepted-derivation',
        transform: 'mirror-x',
        sourceOmissions: [
          'base-boundary-seam',
          'upper-boundary-seam',
        ],
        mirrorPolicy:
          'omit-two-source-boundary-seams-then-whole-cell-mirror-x',
      },
    ]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision,
    ).toMatchObject({
      kind: 'accepted-boundary-seam-filtered-whole-cell-x-mirror',
      scope: 'external-proof-source-reuse',
      sourceDirectory: SOURCE_PREFIX,
      reusedSourceFiles: [
        'open_cross_filled_ne_sw-base.svg',
        'open_cross_filled_ne_sw-upper.svg',
      ],
      newAuthoredSourceFiles: [],
      sourceCanvas: 128,
      mirrorAxisX: 64,
      mirrorPolicy:
        'omit-two-source-boundary-seams-then-whole-cell-mirror-x',
      filterProvenance:
        'mask-40-owner-accepted-boundary-seam-filter',
      sourceRelationship: 'accepted-mask-30-source-derived-reuse',
      verticalRegisterPolicy: {
        north: 'east',
        south: 'west',
      },
    });
  });

  it('rejects demotion, occupancy, transform, register, and production drift', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [40] as const,
        maskRowsAccepted: [] as const,
        derivationAccepted: false,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'none',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate({
        ...gate,
        compactMatrix: [[40]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate({
        ...gate,
        renderingDecision: {
          ...gate.renderingDecision,
          verticalRegisterPolicy: {
            north: 'west',
            south: 'east',
          },
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/proof-only production boundary/);
  });

  it('does not mutate blob, templates, exporter, or authored production surfaces', () => {
    const sourceStem =
      EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE
        .candidate.sourceStem;
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(BLOB_CONFIGS[40]).toBe(0xaf);
    expect(A1B_AUTHORED_STEMS).not.toContain(sourceStem);
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(sourceStem);
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
