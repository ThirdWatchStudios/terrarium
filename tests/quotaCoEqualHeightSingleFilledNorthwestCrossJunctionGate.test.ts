import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bSingleFilledNorthwestCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bSingleFilledNorthwestCrossJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleFilledNorthwestCrossJunctionGate,
  type EqualHeightSingleFilledNorthwestCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleFilledNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/single-filled-northwest-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(cellPixels: number): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_nw-base.svg')) +
    stripSvgShell(source('open_cross_filled_nw-upper.svg'));
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

function matrixFor(
  pattern: readonly string[],
): EqualHeightSingleFilledNorthwestCrossJunctionMatrix {
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
    })) as EqualHeightSingleFilledNorthwestCrossJunctionMatrix;
}

const singleFilledNorthwestCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (column === armLength - 1 && row === armLength - 1)
        ? '#'
        : '.',
    ).join(''),
  );
};

describe('QuotaCo accepted single-filled northwest cross-junction gate', () => {
  it('strictly compiles the exact flattened two-file mask_37 inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_nw-base.svg',
      'open_cross_filled_nw-upper.svg',
    ]);
    expect(
      A1B_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
    ).toEqual([
      expect.objectContaining({
        id: 'open_cross_filled_nw-base',
        filename: 'open_cross_filled_nw-base.svg',
        sourceMaskIndex: 37,
        boundaryRole: 'northwest-filled-cross-hub',
        layer: 'base',
        semanticGroup: 'detail/base',
      }),
      expect.objectContaining({
        id: 'open_cross_filled_nw-upper',
        filename: 'open_cross_filled_nw-upper.svg',
        sourceMaskIndex: 37,
        boundaryRole: 'northwest-filled-cross-hub',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      }),
    ]);
    const compiled =
      await compileA1bSingleFilledNorthwestCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_nw-base.svg',
      'open_cross_filled_nw-upper.svg',
    ]);
    for (const candidate of compiled) {
      expect(candidate.shapes.length).toBeGreaterThan(0);
      expect(candidate.content).not.toMatch(
        /\b(?:transform|href|xlink:href)\s*=/,
      );
      expect(
        candidate.shapes.every(({ silhouette }) => silhouette === false),
      ).toBe(true);
    }
  });

  it('locks the native east-register shell and one cream owner at every review size', () => {
    expect(source('open_cross_filled_nw-base.svg')).toContain(
      'id="base-buried-nw-underlay" d="M116.5 0L0 0 0 76.211 116.5 76.211Z"',
    );
    const upper = source('open_cross_filled_nw-upper.svg');
    expect(upper).toContain(
      'id="upper-contour" d="M116.5 0L0 0 0 79.53 18.604 79.53C27.768 79.53 35.196 86.958 35.196 96.122L35.196 128 116.5 128 116.5 96.122C116.5 86.958 117.419 79.53 118.554 79.53L128 79.53 128 11.5 118.554 11.5C117.419 11.5 116.5 10.581 116.5 9.446Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M113.181 0L0 0 0 76.211 21.922 76.211C31.086 76.211 38.515 83.64 38.515 92.804L38.515 128 113.181 128 113.181 92.804C113.181 83.64 117.009 76.211 118.143 76.211L128 76.211 128 14.819 118.143 14.819C117.009 14.819 113.181 10.991 113.181 9.857Z"',
    );
    expect(upper).toContain(
      'id="upper-south-plane-light" d="M113.181 64.596L39.344 64.596C50.34 64.596 59.256 73.511 59.256 84.507L59.256 128 113.181 128Z"',
    );
    expect(upper).toContain(
      'id="upper-south-arris-lip" d="M39.344 64.596L36.856 64.596C47.851 64.596 56.767 73.511 56.767 84.507L56.767 128 59.256 128 59.256 84.507C59.256 73.511 50.34 64.596 39.344 64.596Z"',
    );
    expect(upper).toContain(
      'id="upper-south-face-shade" d="M36.856 64.596L15.285 64.596C26.281 64.596 35.196 73.511 35.196 84.507L35.196 128 56.767 128 56.767 84.507C56.767 73.511 47.851 64.596 36.856 64.596Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-seam" d="M127.25 23.115L118.554 23.115C117.193 23.115 113.181 14.2 113.181 10.473L113.181 0.75M56.767 127L56.767 84.507C56.767 73.511 47.851 64.596 36.856 64.596L16.944 64.596"',
    );
    expect(upper).not.toMatch(
      /id="(?:upper-nw-solid-top|upper-cream-bridge|upper-secondary-cream)"/,
    );
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    for (const cellPixels of [240, 90, 40] as const) {
      const raster = rasterCandidate(cellPixels);
      const pixels = raster.pixels;
      expect([raster.width, raster.height]).toEqual([
        cellPixels,
        cellPixels,
      ]);
      expect(
        pixels.some(
          (channel, offset) => offset % 4 === 3 && channel > 0,
        ),
        `mask_37 alpha at ${cellPixels}px`,
      ).toBe(true);
    }
  });

  it('rejects transformed, duplicated, drifted, or unexpected source art', async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), 'quota-co-single-filled-northwest-cross-'),
    );
    const base = source('open_cross_filled_nw-base.svg');
    const upper = source('open_cross_filled_nw-upper.svg');
    const writeInventory = (
      baseSource: string,
      upperSource: string,
    ): void => {
      writeFileSync(
        path.join(temporaryDirectory, 'README.md'),
        'temporary test bank\n',
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_nw-base.svg'),
        baseSource,
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_nw-upper.svg'),
        upperSource,
      );
    };
    const compileTemporary = () =>
      compileA1bSingleFilledNorthwestCrossJunctionProposalDirectory({
        inputDir: temporaryDirectory,
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs/single-filled-northwest-cross-junction-test',
      });

    try {
      writeInventory(base, upper.replace(
        '<g id="detail/upper">',
        '<g id="detail/upper" transform="translate(0 0)">',
      ));
      await expect(compileTemporary()).rejects.toThrow(/without transforms/);

      writeInventory(base, upper.replace(
        '</g>',
        '<path id="upper-nw-solid-top" d="M0 0H36V88H0Z" fill="#D9D0B9"/></g>',
      ));
      await expect(compileTemporary()).rejects.toThrow(
        /duplicate cream ownership through upper-nw-solid-top/,
      );

      writeInventory(
        base,
        upper.replace(
          'M113.181 0L0 0 0 76.211',
          'M113.181 0L1 0 0 76.211',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /exact native east-register geometry for upper-shell/,
      );

      writeInventory(base, upper);
      writeFileSync(
        path.join(temporaryDirectory, 'unexpected.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg"/>',
      );
      await expect(compileTemporary()).rejects.toThrow(
        /unexpected source unexpected.svg/,
      );
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('locks mask_37 as a separate accepted direct source, not a mirror', () => {
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem: 'equal-height-single-filled-northwest-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-single-filled-northwest-cross-junction-gate',
      contract: false,
      topologyClass: 'single-filled-northwest-cross-junction',
      candidate: {
        maskIndex: 37,
        sourceMaskIndex: 37,
        sourceStem: 'open_cross_filled_nw',
        baseFile: 'open_cross_filled_nw-base.svg',
        upperFile: 'open_cross_filled_nw-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['ne', 'se', 'sw'],
        solidDiagonals: ['nw'],
        fixedLightRole: 'northwest-filled-four-way-hub-east-register',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      installedNeighborMaskRows: [
        1, 2, 4, 5, 8, 10, 16, 18, 20, 26, 27,
      ],
      maskRowsUnderReview: [],
      maskRowsAccepted: [37],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      verticalRegister: {
        facing: 'east-fixed',
        ordinaryNeighborMaskRows: [1, 4, 5],
        fixedSourceMaskRows: [27, 37],
        ordinaryNeighborTransform: 'mirror-x',
        mixedFacingAllowed: false,
        westFacingControlMaskIndex: 19,
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
    expect(BLOB_CONFIGS[37]).toBe(0x8f);
    expect(configForIndex(37)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'concave',
      sw: 'concave',
      nw: 'solid',
    });
    expect(
      () =>
        validateEqualHeightSingleFilledNorthwestCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 1/3/6-arm evidence from actual northwest occupancy', () => {
    expect(singleFilledNorthwestCrossPattern(1)).toEqual([
      '##.',
      '###',
      '.#.',
    ]);
    const gate =
      EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE;
    expect(gate.compactMatrix).toEqual(
      matrixFor(singleFilledNorthwestCrossPattern(1)),
    );
    expect(gate.threeCellArmMatrix).toEqual(
      matrixFor(singleFilledNorthwestCrossPattern(3)),
    );
    expect(gate.sixCellArmMatrix).toEqual(
      matrixFor(singleFilledNorthwestCrossPattern(6)),
    );
    expect(gate.compactMatrix).toEqual([
      [20, 26, null],
      [16, 37, 8],
      [null, 1, null],
    ]);
    expect(gate.threeCellArmMatrix[2]).toEqual([
      null, null, 20, 27, null, null, null,
    ]);
    expect(gate.threeCellArmMatrix[3]).toEqual([
      2, 10, 18, 37, 10, 10, 8,
    ]);
    expect(gate.sixCellArmMatrix[5]).toEqual([
      null, null, null, null, null, 20, 27,
      null, null, null, null, null, null,
    ]);
    expect(gate.sixCellArmMatrix[6]).toEqual([
      2, 10, 10, 10, 10, 18, 37, 10, 10, 10, 10, 10, 8,
    ]);
  });

  it('keeps every installed neighbor accepted while recording row 37 direct provenance', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE;
    const installedMasks = new Set(
      gate.sixCellArmMatrix
        .flat()
        .filter((index): index is number => index !== null),
    );
    installedMasks.delete(37);
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 18, 20, 27,
    ]);
    expect(gate.installedNeighborMaskRows).toEqual([
      1, 2, 4, 5, 8, 10, 16, 18, 20, 26, 27,
    ]);
    for (const index of gate.installedNeighborMaskRows) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[37]).toMatchObject({
      id: 'mask_37',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'se', 'sw'],
      solidDiagonals: ['nw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-filled-northwest-cross-junction',
          sourceStem: 'open_cross_filled_nw',
          baseFile: 'open_cross_filled_nw-base.svg',
          upperFile: 'open_cross_filled_nw-upper.svg',
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
    expect(gate.acceptedLedgerCounts).toEqual(
      EQUAL_HEIGHT_MASK_LEDGER.counts,
    );
    expect(A1B_AUTHORED_STEMS).not.toContain('open_cross_filled_nw');
  });

  it('rejects demotion, matrix, transform, or production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightSingleFilledNorthwestCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [37] as const,
        maskRowsAccepted: [] as const,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleFilledNorthwestCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'mirror-x',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleFilledNorthwestCrossJunctionGate({
        ...gate,
        compactMatrix: [[37]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightSingleFilledNorthwestCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/proof-only boundary/);
  });
});
