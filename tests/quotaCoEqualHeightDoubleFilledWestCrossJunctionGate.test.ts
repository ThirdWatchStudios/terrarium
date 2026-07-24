import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledWestCrossJunctionGate,
  type EqualHeightDoubleFilledWestCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledWestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction';
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

function matrixFor(
  pattern: readonly string[],
): EqualHeightDoubleFilledWestCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
  const occupied = (column: number, row: number): boolean =>
    row >= 0 && row < rows && column >= 0 && column < columns &&
    pattern[row][column] === '#';
  return pattern.map((row, rowIndex) => [...row].map((cell, columnIndex) => {
    if (cell !== '#') return null;
    let raw = 0;
    for (const [bit, dx, dy] of NEIGHBORS) {
      if (occupied(columnIndex + dx, rowIndex + dy)) raw |= bit;
    }
    return blobIndex(raw);
  })) as EqualHeightDoubleFilledWestCrossJunctionMatrix;
}

const doubleFilledWestCrossPattern = (extent: number): readonly string[] => {
  const size = extent * 2 + 1;
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, column) => (
      column === extent - 1 ||
      column === extent ||
      (row === extent && column > extent)
        ? '#'
        : '.'
    )).join('')
  ));
};

describe('QuotaCo accepted double-filled west cross-junction gate', () => {
  it('locks mask_43 as the plain whole-cell X mirror of accepted mask_25', () => {
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-double-filled-west-cross-junction-gate',
        version: 0,
        status: 'owner-accepted-double-filled-west-cross-junction-gate',
        contract: false,
        topologyClass: 'double-filled-west-cross-junction',
        candidate: {
          maskIndex: 43,
          sourceMaskIndex: 25,
          sourceStem: 'open_cross_filled_e',
          baseFile: 'open_cross_filled_e-base.svg',
          upperFile: 'open_cross_filled_e-upper.svg',
          connectedEdges: ['n', 'e', 's', 'w'],
          openPockets: ['ne', 'se'],
          solidDiagonals: ['sw', 'nw'],
          fixedLightRole: 'east-branch-into-double-width-west-slab',
          transform: 'mirror-x',
          derivation: 'none',
          resolution: 'approved-derivation',
        },
        baselineMaskRows: [8, 10, 16, 20, 24, 25, 26, 34, 42],
        maskRowsUnderReview: [],
        maskRowsAccepted: [43],
        reviewCellSizes: [240, 90, 40],
        reviewExtentLengths: [1, 3, 6],
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
    expect(BLOB_CONFIGS[25]).toBe(0x3f);
    expect(BLOB_CONFIGS[43]).toBe(0xcf);
    expect(configForIndex(43)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'solid', nw: 'solid',
    });
    expect(
      () => validateEqualHeightDoubleFilledWestCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-cell matrices from the west-slab occupancy', () => {
    expect(doubleFilledWestCrossPattern(1)).toEqual(['##.', '###', '##.']);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.compactMatrix,
    ).toEqual(matrixFor(doubleFilledWestCrossPattern(1)));
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE
        .threeCellExtentMatrix,
    ).toEqual(matrixFor(doubleFilledWestCrossPattern(3)));
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE
        .sixCellExtentMatrix,
    ).toEqual(matrixFor(doubleFilledWestCrossPattern(6)));
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.compactMatrix,
    ).toEqual([
      [20, 26, null],
      [24, 43, 8],
      [16, 34, null],
    ]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE
        .threeCellExtentMatrix,
    ).toEqual([
      [null, null, 20, 26, null, null, null],
      [null, null, 24, 42, null, null, null],
      [null, null, 24, 42, null, null, null],
      [null, null, 24, 43, 10, 10, 8],
      [null, null, 24, 42, null, null, null],
      [null, null, 24, 42, null, null, null],
      [null, null, 16, 34, null, null, null],
    ]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE
        .sixCellExtentMatrix[6],
    ).toEqual([null, null, null, null, null, 24, 43, 10, 10, 10, 10, 10, 8]);
  });

  it('reuses the accepted two-file source bank without new SVGs or filtering', () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ]);
    const base = readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_e-base.svg'),
      'utf8',
    );
    const upper = readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_e-upper.svg'),
      'utf8',
    );
    expect(base).toContain('id="base-buried-east-underlay"');
    expect(upper).toContain('id="upper-shell"');
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE
        .renderingDecision,
    ).toMatchObject({
      kind: 'accepted-plain-whole-cell-x-mirror',
      scope: 'external-proof-source-reuse',
      sourceDirectory: SOURCE_PREFIX,
      reusedSourceFiles: [
        'open_cross_filled_e-base.svg',
        'open_cross_filled_e-upper.svg',
      ],
      newAuthoredSourceFiles: [],
      sourceCanvas: 128,
      mirrorAxisX: 64,
      mirrorPolicy: 'whole-cell-x-no-filter',
    });
  });

  it('renders the accepted gate as its own live workbench proof without changing source art', () => {
    const styleLoop = readFileSync(
      path.resolve(process.cwd(), 'scripts/styleLoop.ts'),
      'utf8',
    );
    expect(styleLoop).toContain(
      "import {\n  EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,\n} from './highOblique/equalHeightDoubleFilledWestCrossJunctionGate';",
    );
    expect(styleLoop).toContain(
      'await renderEqualHeightDoubleFilledWestCrossJunctionGate(options, root);',
    );
    expect(styleLoop).toContain(
      'doubleFilledWestCrossJunctionRenderedAt: renderedAt',
    );
    expect(styleLoop).toContain(
      'candidate.baseFile, candidate.upperFile, candidate.transform',
    );
    const ledgerRenderer = styleLoop.slice(
      styleLoop.indexOf('async function renderEqualHeightMaskLedger'),
      styleLoop.indexOf('async function renderLowSoutheastCornerFocus'),
    );
    expect(ledgerRenderer).not.toContain(
      'doubleFilledWestCrossJunctionGateFileOverrides',
    );
  });

  it('promotes mask_43 as the accepted whole-cell X derivation of mask_25', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[25]).toMatchObject({
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_cross_filled_e',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[43]).toMatchObject({
      id: 'mask_43',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'se'],
      solidDiagonals: ['sw', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-west-cross-junction',
          sourceStem: 'open_cross_filled_e',
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

  it('rejects transform, extent, acceptance, and production-boundary drift', () => {
    expect(() => validateEqualHeightDoubleFilledWestCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
      candidate: {
        ...EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.candidate,
        transform: 'none',
      },
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightDoubleFilledWestCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
      compactMatrix: [[43]] as const,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE))
      .toThrow(/compact matrix must be 3x3/);
    expect(() => validateEqualHeightDoubleFilledWestCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
      maskRowsUnderReview: [43] as const,
      maskRowsAccepted: [] as const,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightDoubleFilledWestCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only production boundary/);
  });
});
