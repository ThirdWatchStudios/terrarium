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
      'id="upper-contour" d="M11.5 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L128 11.5 128 128 0 128 0 11.5 9.446 11.5C10.581 11.5 11.5 10.581 11.5 9.446Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M14.819 0L89.485 0 89.485 9.446C89.485 10.807 98.4 14.819 109.396 14.819L128 14.819 128 128 0 128 0 14.819 9.857 14.819C10.991 14.819 14.819 10.991 14.819 9.857Z"',
    );
    expect(upper).toContain(
      'id="upper-north-plane-light" d="M14.819 0L68.744 0 68.744 9.036C68.744 10.397 77.66 11.5 88.656 11.5L14.819 11.5Z"',
    );
    expect(upper).toContain(
      'id="upper-north-arris-lip" d="M68.744 0L71.233 0 71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L88.656 11.5C77.66 11.5 68.744 10.397 68.744 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-north-coral-register" d="M79.53 0L87.826 0 87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5L99.441 11.5C88.445 11.5 79.53 10.397 79.53 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-north-green-handoff" d="M87.826 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L107.737 11.5C96.741 11.5 87.826 10.397 87.826 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-north-face-shade" d="M71.233 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L91.144 11.5C80.149 11.5 71.233 10.397 71.233 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-seam" d="M71.233 0.75L71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L111.056 11.5M0.75 23.115L127 23.115"',
    );
    expect(upper).toContain(
      'id="upper-register-seam" d="M87.826 0.75L87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5"',
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
    const alphaChannels = (row: Uint8Array): readonly number[] =>
      [...row].filter((_, channel) => channel % 4 === 3);
    expect(alphaChannels(candidateNorthSocket)).toEqual(
      alphaChannels(acceptedSouthSocket),
    );
    expect(
      alphaChannels(candidateNorthSocket)
        .map((alpha, x) => alpha > 0 ? x : -1)
        .filter((x) => x >= 0),
    ).toEqual(
      Array.from({ length: 113 }, (_, offset) => offset + 11),
    );

    const rgbaAt = (
      pixels: Uint8Array,
      width: number,
      x: number,
      y: number,
    ): readonly number[] => {
      const offset = (y * width + x) * 4;
      return [...pixels.slice(offset, offset + 4)];
    };

    expect(rgbaAt(candidate, 128, 69, 5)).toEqual(
      [228, 222, 206, 255],
    );
    expect(rgbaAt(candidate, 128, 80, 5)).toEqual(
      [160, 84, 68, 255],
    );
    expect(rgbaAt(candidate, 128, 90, 5)).toEqual(
      [36, 66, 53, 255],
    );
    expect(rgbaAt(candidate, 128, 108, 10)).toEqual(
      [36, 64, 52, 255],
    );
    expect(rgbaAt(candidate, 128, 114, 11)).toEqual(
      [33, 37, 35, 223],
    );
    expect(rgbaAt(candidate, 128, 60, 18)).toEqual(
      [224, 216, 198, 255],
    );
    for (let y = 0; y <= 4; y += 1) {
      expect(rgbaAt(candidate, 128, 124, y), `open crook at 124,${y}`)
        .toEqual([0, 0, 0, 0]);
    }

    const candidate40 = rasterPixels(
      SOURCE_DIRECTORY,
      'open_cross_filled_s',
      40,
    );
    expect(rgbaAt(candidate40, 40, 21, 1)).toEqual(
      [215, 209, 193, 255],
    );
    expect(rgbaAt(candidate40, 40, 25, 1)).toEqual(
      [160, 84, 68, 255],
    );
    expect(rgbaAt(candidate40, 40, 28, 1)).toEqual(
      [36, 66, 53, 255],
    );
    expect(rgbaAt(candidate40, 40, 33, 3)).toEqual(
      [36, 47, 41, 245],
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
