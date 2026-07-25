import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledSouthCrossJunctionGate,
  type EqualHeightDoubleFilledSouthCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledSouthCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';

const SOURCE_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/double-filled-south-cross-junction',
);
const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const rasterPixels = (
  directory: string,
  stem: string,
  size = 128,
): Uint8Array => {
  const body = ['base', 'upper']
    .map((layer) =>
      stripSvgShell(
        readFileSync(path.join(directory, `${stem}-${layer}.svg`), 'utf8'),
      ),
    )
    .join('');
  const rendered = new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: size },
      font: { loadSystemFonts: false },
    },
  ).render();
  // Cache this getter exactly once: resvg copies the native pixel buffer.
  return rendered.pixels;
};

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
): EqualHeightDoubleFilledSouthCrossJunctionMatrix {
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
    })) as EqualHeightDoubleFilledSouthCrossJunctionMatrix;
}

const doubleFilledSouthCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (row === armLength + 1 &&
        (column === armLength - 1 || column === armLength + 1))
        ? '#'
        : '.',
    ).join(''),
  );
};

describe('QuotaCo owner-accepted double-filled south cross-junction gate', () => {
  it('locks mask_32 as one accepted fixed-view direct source', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem: 'equal-height-double-filled-south-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-double-filled-south-cross-junction-gate',
      contract: false,
      topologyClass: 'double-filled-south-cross-junction',
      candidate: {
        maskIndex: 32,
        sourceMaskIndex: 32,
        sourceStem: 'open_cross_filled_s',
        baseFile: 'open_cross_filled_s-base.svg',
        upperFile: 'open_cross_filled_s-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['ne', 'nw'],
        solidDiagonals: ['se', 'sw'],
        fixedLightRole: 'south-filled-four-way-slab-fixed-view',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [23, 29, 38, 39],
      installedNeighborMaskRows: [
        1, 2, 4, 5, 8, 10, 16, 20, 22, 26, 28, 34, 38, 39,
      ],
      maskRowsUnderReview: [],
      maskRowsAccepted: [32],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
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
    expect(BLOB_CONFIGS[32]).toBe(0x6f);
    expect(configForIndex(32)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'solid',
      nw: 'concave',
    });
    expect(
      () => validateEqualHeightDoubleFilledSouthCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives the compact and 3/6-cell symmetric-arm matrices from occupancy', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE;
    expect(doubleFilledSouthCrossPattern(1)).toEqual([
      '.#.',
      '###',
      '###',
    ]);
    expect(gate.compactMatrix).toEqual(
      matrixFor(doubleFilledSouthCrossPattern(1)),
    );
    expect(gate.threeCellArmMatrix).toEqual(
      matrixFor(doubleFilledSouthCrossPattern(3)),
    );
    expect(gate.sixCellArmMatrix).toEqual(
      matrixFor(doubleFilledSouthCrossPattern(6)),
    );

    expect(gate.compactMatrix).toEqual([
      [null, 4, null],
      [20, 32, 26],
      [16, 38, 34],
    ]);
    expect(gate.threeCellArmMatrix).toEqual([
      [null, null, null, 4, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 5, null, null, null],
      [2, 10, 22, 32, 28, 10, 8],
      [null, null, 16, 39, 34, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(gate.sixCellArmMatrix[6]).toEqual([
      2, 10, 10, 10, 10, 22, 32, 28, 10, 10, 10, 10, 8,
    ]);
    expect(gate.sixCellArmMatrix[7]).toEqual([
      null, null, null, null, null, 16, 39,
      34, null, null, null, null, null,
    ]);
    expect(gate.sixCellArmMatrix[12]).toEqual([
      null, null, null, null, null, null, 1,
      null, null, null, null, null, null,
    ]);
  });

  it('uses only accepted installed neighbors at compact and long extents', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE;
    const installedMasks = new Set([
      ...gate.compactMatrix.flat(),
      ...gate.threeCellArmMatrix.flat(),
      ...gate.sixCellArmMatrix.flat(),
    ].filter((index) => index !== null));
    installedMasks.delete(32);

    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 16, 20, 22, 26, 28, 34, 38, 39,
    ]);
    expect([...gate.installedNeighborMaskRows]).toEqual(
      [...installedMasks].sort((left, right) => left - right),
    );
    for (const index of installedMasks) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
  });

  it('promotes mask_32 to one direct source and advances the accepted ledger', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[32]).toMatchObject({
      id: 'mask_32',
      index: 32,
      canonicalMask: 0x6f,
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'nw'],
      solidDiagonals: ['se', 'sw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-south-cross-junction',
          sourceStem: 'open_cross_filled_s',
          baseFile: 'open_cross_filled_s-base.svg',
          upperFile: 'open_cross_filled_s-upper.svg',
          transform: 'none',
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
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE
        .acceptedLedgerCounts,
    ).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('records accepted direct authorship and rejects a Y-flipped mask_39 shortcut', () => {
    const decision =
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE
        .renderingDecision;
    expect(decision).toMatchObject({
      kind: 'one-accepted-authored-double-filled-south-four-way-hub',
      scope: 'external-proof-source-bank',
      sourceDirectory:
        'assets/walls/quota-co-building-system-proofs/double-filled-south-cross-junction',
      authoredSourceFiles: [
        'open_cross_filled_s-base.svg',
        'open_cross_filled_s-upper.svg',
      ],
      sourceCanvas: 128,
      sourceAuthorship: 'flattened-fixed-view-no-transform',
      geometryCueMaskIndices: [23, 29, 38, 39],
      sourceRelationship: 'authored-cues-only-no-derived-provenance',
      oppositeControlMaskIndex: 39,
      oppositeControlPolicy:
        'mask_39 is a geometry and fixed-light comparison only; Y mirror is forbidden',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[39].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
    });
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.yMirrorAllowed,
    ).toBe(false);
  });

  it('keeps the north socket aligned and turns every face layer onto one shared dark ledge', () => {
    const upper = readFileSync(
      path.join(SOURCE_DIRECTORY, 'open_cross_filled_s-upper.svg'),
      'utf8',
    );
    expect(upper.indexOf('upper-north-coral-register')).toBeLessThan(
      upper.indexOf('upper-north-green-handoff'),
    );
    expect(upper.indexOf('upper-north-green-handoff')).toBeLessThan(
      upper.indexOf('upper-north-face-shade'),
    );
    expect(upper.indexOf('upper-north-face-shade')).toBeLessThan(
      upper.indexOf('upper-slab-reveal-light'),
    );
    expect(upper).toContain(
      'id="upper-contour" d="M56 0H105V44A12 12 0 0 0 117 56H128V128H0V56H46A10 10 0 0 0 56 46Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M58 0H103V46A12 12 0 0 0 115 58H128V128H0V58H48A10 10 0 0 0 58 48Z"',
    );
    expect(upper).toContain(
      'id="upper-north-plane-light" d="M58 0H90.5V44A12 12 0 0 0 102.5 56H58Z"',
    );
    expect(upper).toContain(
      'id="upper-north-arris-lip" d="M90.5 0H92V44A12 12 0 0 0 104 56H102.5A12 12 0 0 1 90.5 44Z"',
    );
    expect(upper).toContain(
      'id="upper-north-coral-register" d="M97 0H102V44A12 12 0 0 0 114 56H109A12 12 0 0 1 97 44Z"',
    );
    expect(upper).toContain(
      'id="upper-north-green-handoff" d="M102 0H105V44A12 12 0 0 0 117 56H114A12 12 0 0 1 102 44Z"',
    );
    expect(upper).toContain(
      'id="upper-north-face-shade" d="M92 0H105V44A12 12 0 0 0 117 56H104A12 12 0 0 1 92 44Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-seam" d="M92 1V44A12 12 0 0 0 104 56H116 M1 63H127"',
    );
    expect(upper).toContain(
      'id="upper-register-seam" d="M102 1V44A12 12 0 0 0 114 56"',
    );

    const straight = rasterPixels(CANONICAL_DIRECTORY, 'full_w_straight');
    const candidate = rasterPixels(
      SOURCE_DIRECTORY,
      'open_cross_filled_s',
    );
    const rowBytes = 128 * 4;
    const acceptedSouthSocket = straight.slice(
      127 * rowBytes,
      128 * rowBytes,
    );
    const candidateNorthSocket = candidate.slice(0, rowBytes);
    expect(candidateNorthSocket).toEqual(acceptedSouthSocket);

    const rgbaAt = (
      pixels: Uint8Array,
      width: number,
      x: number,
      y: number,
    ): readonly number[] => {
      const offset = (y * width + x) * 4;
      return [...pixels.slice(offset, offset + 4)];
    };

    expect(rgbaAt(candidate, 128, 94, 50)).toEqual(
      [136, 133, 120, 255],
    );
    expect(rgbaAt(candidate, 128, 102, 50)).toEqual(
      [158, 83, 68, 255],
    );
    expect(rgbaAt(candidate, 128, 105, 50)).toEqual(
      [36, 66, 53, 255],
    );
    expect(rgbaAt(candidate, 128, 114, 54)).toEqual(
      [36, 66, 53, 255],
    );
    expect(rgbaAt(candidate, 128, 116, 56)).toEqual(
      [37, 42, 40, 255],
    );
    expect(rgbaAt(candidate, 128, 105, 58)).toEqual(
      [224, 216, 198, 255],
    );
    for (let y = 50; y <= 54; y += 1) {
      expect(rgbaAt(candidate, 128, 124, y), `open crook at 124,${y}`)
        .toEqual([0, 0, 0, 0]);
    }

    const candidate40 = rasterPixels(
      SOURCE_DIRECTORY,
      'open_cross_filled_s',
      40,
    );
    expect(rgbaAt(candidate40, 40, 29, 14)).toEqual(
      [178, 171, 153, 255],
    );
    expect(rgbaAt(candidate40, 40, 31, 15)).toEqual(
      [157, 83, 67, 255],
    );
    expect(rgbaAt(candidate40, 40, 32, 15)).toEqual(
      [65, 73, 61, 255],
    );
    expect(rgbaAt(candidate40, 40, 33, 16)).toEqual(
      [47, 61, 51, 255],
    );
  });

  it('rejects demotion, matrix, transform, or production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightDoubleFilledSouthCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [32] as const,
        maskRowsAccepted: [] as const,
        directSourceAccepted: false,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledSouthCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'mirror-x',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledSouthCrossJunctionGate({
        ...gate,
        compactMatrix: [[32]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightDoubleFilledSouthCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/accepted proof boundary/);
  });
});
