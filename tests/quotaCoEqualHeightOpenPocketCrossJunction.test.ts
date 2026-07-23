import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bOpenPocketCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bOpenPocketCrossJunctionProposal';
import {
  EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
  validateEqualHeightOpenPocketCrossJunctionGate,
  type EqualHeightOpenPocketCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightOpenPocketCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { BLOB_CONFIGS, NB, blobIndex, configForIndex } from '../src/tiles/blob';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/open-pocket-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(cellPixels: number): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_junction-base.svg')) +
    stripSvgShell(source('open_cross_junction-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
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

/** Derive canonical mask indices from literal occupied cells. */
function matrixFor(pattern: readonly string[]): EqualHeightOpenPocketCrossJunctionMatrix {
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
  }));
}

const plusPattern = (armLength: number): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) => (
    row === armLength
      ? '#'.repeat(size)
      : `${'.'.repeat(armLength)}#${'.'.repeat(armLength)}`
  ));
};

describe('QuotaCo owner-accepted open-pocket cross-junction gate', () => {
  it('strictly compiles the exact flattened two-file proof inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_junction-base.svg',
      'open_cross_junction-upper.svg',
    ]);
    expect(A1B_OPEN_POCKET_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY)
      .toEqual([
        expect.objectContaining({
          id: 'open_cross_junction-base',
          sourceMaskIndex: 15,
          layer: 'base',
          semanticGroup: 'detail/base',
        }),
        expect.objectContaining({
          id: 'open_cross_junction-upper',
          sourceMaskIndex: 15,
          layer: 'upper',
          semanticGroup: 'detail/upper',
        }),
      ]);
    const compiled = await compileA1bOpenPocketCrossJunctionProposalDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(compiled.map(({ filename, shapes }) => [filename, shapes.length]))
      .toEqual([
        ['open_cross_junction-base.svg', 6],
        ['open_cross_junction-upper.svg', 19],
      ]);
    for (const candidate of compiled) {
      expect(candidate.content).not.toMatch(/\b(?:transform|href|xlink:href)\s*=/);
      expect(candidate.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
    }
  });

  it('rasterizes the composed source at every declared review size', () => {
    expect(source('open_cross_junction-upper.svg'))
      .toContain('id="upper-arris-seam" d="M92 1V58 M1 63H127 M92 88V127"');
    expect(source('open_cross_junction-upper.svg')).not.toContain('104 63');
    for (const cellPixels of [240, 90, 40] as const) {
      const raster = rasterCandidate(cellPixels);
      expect([raster.width, raster.height]).toEqual([cellPixels, cellPixels]);
      expect(
        raster.pixels.some((channel, offset) => offset % 4 === 3 && channel > 0),
        `mask_15 alpha at ${cellPixels}px`,
      ).toBe(true);
    }
  });

  it('locks mask_15 as one accepted authored all-open four-way source', () => {
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-open-pocket-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-open-pocket-cross-junction-gate',
      contract: false,
      topologyClass: 'open-pocket-cross-junction',
      candidate: {
        maskIndex: 15,
        sourceMaskIndex: 15,
        sourceStem: 'open_cross_junction',
        baseFile: 'open_cross_junction-base.svg',
        upperFile: 'open_cross_junction-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['ne', 'se', 'sw', 'nw'],
        solidDiagonals: [],
        fixedLightRole: 'four-way-hub',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [1, 2, 4, 5, 7, 8, 10, 11, 13, 14],
      maskRowsUnderReview: [],
      maskRowsAccepted: [15],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
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
    expect(BLOB_CONFIGS[15]).toBe(0x0f);
    expect(configForIndex(15)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'concave', nw: 'concave',
    });
    expect(() => validateEqualHeightOpenPocketCrossJunctionGate()).not.toThrow();
  });

  it('derives the exact compact, three-cell-arm, and six-cell-arm matrices from occupancy', () => {
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual(matrixFor(plusPattern(1)));
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.threeCellArmMatrix)
      .toEqual(matrixFor(plusPattern(3)));
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.sixCellArmMatrix)
      .toEqual(matrixFor(plusPattern(6)));
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.compactMatrix).toEqual([
      [null, 4, null],
      [2, 15, 8],
      [null, 1, null],
    ]);
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.threeCellArmMatrix[3])
      .toEqual([2, 10, 10, 15, 10, 10, 8]);
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.sixCellArmMatrix[6])
      .toEqual([2, 10, 10, 10, 10, 10, 15, 10, 10, 10, 10, 10, 8]);
  });

  it('records mask_15 as an accepted direct source and advances the ledger once', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[15]).toMatchObject({
      id: 'mask_15',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'se', 'sw', 'nw'],
      solidDiagonals: [],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'open-pocket-cross-junction',
          sourceStem: 'open_cross_junction',
          baseFile: 'open_cross_junction-base.svg',
          upperFile: 'open_cross_junction-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 22,
      'approved-derivation': 16,
      'synthetic-assembly': 9,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.acceptedLedgerCounts)
      .toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('rejects identity or production-boundary drift', () => {
    expect(() => validateEqualHeightOpenPocketCrossJunctionGate({
      ...EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
      maskRowsUnderReview: [15] as const,
    } as unknown as typeof EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightOpenPocketCrossJunctionGate({
      ...EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(() => validateEqualHeightOpenPocketCrossJunctionGate({
      ...EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
      compactMatrix: [[15]] as const,
    } as unknown as typeof EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE))
      .toThrow(/compact matrix must be 3x3/);
  });
});
