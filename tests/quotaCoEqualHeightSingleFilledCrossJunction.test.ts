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
  A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bSingleFilledCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bSingleFilledCrossJunctionProposal';
import {
  EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleFilledCrossJunctionGate,
  type EqualHeightSingleFilledCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { BLOB_CONFIGS, NB, blobIndex, configForIndex } from '../src/tiles/blob';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/single-filled-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const BUILDING_SYSTEM_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);
const WEST_PARTIAL_T_JUNCTION_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/west-partial-t-junction',
);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(cellPixels: number): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function rasterSourcePair(
  directory: string,
  baseFile: string,
  upperFile: string,
  mirrorX = false,
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(readFileSync(path.join(directory, baseFile), 'utf8')) +
    stripSvgShell(readFileSync(path.join(directory, upperFile), 'utf8'));
  const transformed = mirrorX
    ? `<g transform="matrix(-1 0 0 1 128 0)">${body}</g>`
    : body;
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${transformed}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
}

function alphaSpan(
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

const spanCenter = ([start, end]: readonly [number, number]): number =>
  (start + end) / 2;

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
function matrixFor(pattern: readonly string[]): EqualHeightSingleFilledCrossJunctionMatrix {
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
  })) as EqualHeightSingleFilledCrossJunctionMatrix;
}

const singleFilledCrossPattern = (armLength: number): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, column) => (
      column === armLength ||
      row === armLength ||
      (column === armLength + 1 && row === armLength - 1)
        ? '#'
        : '.'
    )).join('')
  ));
};

describe('QuotaCo owner-accepted single-filled cross-junction gate', () => {
  it('strictly compiles the exact flattened two-file mask_19 proof inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_ne-base.svg',
      'open_cross_filled_ne-upper.svg',
    ]);
    expect(A1B_SINGLE_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY)
      .toEqual([
        expect.objectContaining({
          id: 'open_cross_filled_ne-base',
          sourceMaskIndex: 19,
          boundaryRole: 'northeast-filled-cross-hub',
          layer: 'base',
          semanticGroup: 'detail/base',
        }),
        expect.objectContaining({
          id: 'open_cross_filled_ne-upper',
          sourceMaskIndex: 19,
          boundaryRole: 'northeast-filled-cross-hub',
          layer: 'upper',
          semanticGroup: 'detail/upper',
        }),
      ]);
    const compiled = await compileA1bSingleFilledCrossJunctionProposalDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_ne-base.svg',
      'open_cross_filled_ne-upper.svg',
    ]);
    for (const candidate of compiled) {
      expect(candidate.shapes.length).toBeGreaterThan(0);
      expect(candidate.content).not.toMatch(/\b(?:transform|href|xlink:href)\s*=/);
      expect(candidate.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
    }
  });

  it('locks one continuous cream-plane owner and rasterizes every review size', () => {
    expect(source('open_cross_filled_ne-base.svg'))
      .toContain('id="base-buried-ne-underlay"');
    const upper = source('open_cross_filled_ne-upper.svg');
    expect(upper).toContain(
      'id="upper-shell" d="M58 0H128V95H113A10 10 0 0 0 103 105V128H58V105A10 10 0 0 0 48 95H0V58H48A10 10 0 0 0 58 48Z"',
    );
    expect(upper).not.toContain('id="upper-ne-solid-top"');
    expect(upper).not.toContain('id="upper-cream-bridge"');
    expect(upper).not.toContain('id="upper-north-plane-light"');
    expect(upper).not.toContain('id="upper-north-arris-lip"');
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    for (const cellPixels of [240, 90, 40] as const) {
      const raster = rasterCandidate(cellPixels);
      expect([raster.width, raster.height]).toEqual([cellPixels, cellPixels]);
      expect(
        raster.pixels.some((channel, offset) => offset % 4 === 3 && channel > 0),
        `mask_19 alpha at ${cellPixels}px`,
      ).toBe(true);
    }
  });

  it('rejects duplicate cream owners and drift in the continuous-plane shell', async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), 'quota-co-single-filled-cross-'),
    );
    const base = source('open_cross_filled_ne-base.svg');
    const upper = source('open_cross_filled_ne-upper.svg');
    const writeInventory = (upperSource: string): void => {
      writeFileSync(path.join(temporaryDirectory, 'README.md'), 'temporary test bank\n');
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_ne-base.svg'),
        base,
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_ne-upper.svg'),
        upperSource,
      );
    };
    const compileTemporary = () =>
      compileA1bSingleFilledCrossJunctionProposalDirectory({
        inputDir: temporaryDirectory,
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs/single-filled-cross-junction-test',
      });

    try {
      writeInventory(upper.replace(
        '</g>',
        '<path id="upper-ne-solid-top" d="M92 0H128V88H103V58H92Z" fill="#D9D0B9"/></g>',
      ));
      await expect(compileTemporary()).rejects.toThrow(
        /duplicate cream ownership through upper-ne-solid-top/,
      );

      writeInventory(upper.replace(
        '</g>',
        '<path id="upper-secondary-cream" d="M92 0H128V88H92Z" fill="#D9D0B9"/></g>',
      ));
      await expect(compileTemporary()).rejects.toThrow(
        /upper-shell as the sole cream path owner/,
      );

      writeInventory(upper.replace(
        '</g>',
        '<path id="upper-north-plane-light" d="M58 0H90.5V58H58Z" fill="#FFFFFF" opacity="0.18"/></g>',
      ));
      await expect(compileTemporary()).rejects.toThrow(
        /buried interior riser through upper-north-plane-light/,
      );

      writeInventory(upper.replace('M58 0H128V95H113', 'M58 0H127V95H113'));
      await expect(compileTemporary()).rejects.toThrow(
        /exact continuous-plane geometry for upper-shell/,
      );
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('locks mask_19 as one accepted direct-authored proof source', () => {
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-single-filled-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-single-filled-cross-junction-gate',
      contract: false,
      topologyClass: 'single-filled-cross-junction',
      candidate: {
        maskIndex: 19,
        sourceMaskIndex: 19,
        sourceStem: 'open_cross_filled_ne',
        baseFile: 'open_cross_filled_ne-base.svg',
        upperFile: 'open_cross_filled_ne-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['se', 'sw', 'nw'],
        solidDiagonals: ['ne'],
        fixedLightRole: 'northeast-filled-four-way-hub',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [15, 17, 18],
      maskRowsUnderReview: [],
      maskRowsAccepted: [19],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      verticalRegister: {
        facing: 'west-fixed',
        ordinaryNeighborMaskRows: [1, 4, 5],
        fixedSourceMaskRows: [19, 21],
        ordinaryNeighborTransform: 'none',
        mixedFacingAllowed: false,
        eastFacingCompanionMaskIndex: 37,
      },
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
    expect(BLOB_CONFIGS[19]).toBe(0x1f);
    expect(configForIndex(19)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'solid', se: 'concave', sw: 'concave', nw: 'concave',
    });
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate()).not.toThrow();
  });

  it('keeps the fixed mask_5 → mask_21 → mask_19 → mask_5 vertical register continuous', () => {
    const westStraight = rasterSourcePair(
      BUILDING_SYSTEM_DIRECTORY,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
    );
    const eastStraight = rasterSourcePair(
      BUILDING_SYSTEM_DIRECTORY,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      true,
    );
    const mask21 = rasterSourcePair(
      WEST_PARTIAL_T_JUNCTION_DIRECTORY,
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    );
    const mask19 = rasterSourcePair(
      SOURCE_DIRECTORY,
      'open_cross_filled_ne-base.svg',
      'open_cross_filled_ne-upper.svg',
    );

    const straightWestNorth = alphaSpan(westStraight, 0);
    const straightWestSouth = alphaSpan(westStraight, 127);
    const straightEastNorth = alphaSpan(eastStraight, 0);
    const straightEastSouth = alphaSpan(eastStraight, 127);
    const mask21North = alphaSpan(mask21, 0);
    const mask21South = alphaSpan(mask21, 127);
    const mask19North = alphaSpan(mask19, 0);
    const mask19South = alphaSpan(mask19, 127);

    expect(straightWestSouth).toEqual([56, 123]);
    expect(mask21North).toEqual(straightWestSouth);
    expect(mask21South).toEqual([56, 127]);
    expect(mask19North).toEqual(mask21South);
    expect(mask19South).toEqual([56, 123]);
    expect(straightWestNorth).toEqual(mask19South);

    expect(spanCenter(mask21North)).toBe(89.5);
    expect(spanCenter(mask21South)).toBe(91.5);
    expect(spanCenter(mask19North)).toBe(91.5);
    expect(spanCenter(mask19South)).toBe(89.5);

    expect(straightEastNorth).toEqual([4, 71]);
    expect(straightEastSouth).toEqual([4, 71]);
    expect(spanCenter(straightEastSouth)).toBe(37.5);
    expect(straightEastSouth).not.toEqual(mask21North);
    expect(straightEastNorth).not.toEqual(mask19South);
  });

  it('derives the compact and 1/3/6-arm evidence from a real occupied northeast cell', () => {
    expect(singleFilledCrossPattern(1)).toEqual(['.##', '###', '.#.']);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual(matrixFor(singleFilledCrossPattern(1)));
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.threeCellArmMatrix)
      .toEqual(matrixFor(singleFilledCrossPattern(3)));
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.sixCellArmMatrix)
      .toEqual(matrixFor(singleFilledCrossPattern(6)));
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual([
        [null, 20, 26],
        [2, 19, 34],
        [null, 1, null],
      ]);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.threeCellArmMatrix[2])
      .toEqual([null, null, null, 21, 26, null, null]);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.threeCellArmMatrix[3])
      .toEqual([2, 10, 10, 19, 35, 10, 8]);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.sixCellArmMatrix[5])
      .toEqual([null, null, null, null, null, null, 21, 26, null, null, null, null, null]);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.sixCellArmMatrix[6])
      .toEqual([2, 10, 10, 10, 10, 10, 19, 35, 10, 10, 10, 10, 8]);
  });

  it('compares the accepted mask_15/17/18 laws while recording mask_19 direct provenance', () => {
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.baselineMaskRows)
      .toEqual([15, 17, 18]);
    expect(configForIndex(15)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'concave', nw: 'concave',
    });
    expect(configForIndex(17)).toEqual({
      n: true, e: true, s: true, w: false,
      ne: 'solid', se: 'concave', sw: 'exposed', nw: 'exposed',
    });
    expect(configForIndex(18)).toEqual({
      n: true, e: true, s: false, w: true,
      ne: 'solid', se: 'exposed', sw: 'exposed', nw: 'concave',
    });
    for (const index of [15, 17, 18] as const) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status)
        .toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[19]).toMatchObject({
      id: 'mask_19',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['se', 'sw', 'nw'],
      solidDiagonals: ['ne'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-filled-northeast-cross-junction',
          sourceStem: 'open_cross_filled_ne',
          baseFile: 'open_cross_filled_ne-base.svg',
          upperFile: 'open_cross_filled_ne-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 19,
      'approved-derivation': 14,
      'synthetic-assembly': 14,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.acceptedLedgerCounts)
      .toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('rejects ledger demotion, identity drift, or production-boundary drift', () => {
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
      maskRowsUnderReview: [19] as const,
      maskRowsAccepted: [] as const,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
      candidate: {
        ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.candidate,
        resolution: 'synthetic-assembly',
      },
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
      compactMatrix: [[19]] as const,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE))
      .toThrow(/compact matrix must be 3x3/);
    expect(() => validateEqualHeightSingleFilledCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
      verticalRegister: {
        ...EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.verticalRegister,
        mixedFacingAllowed: true,
      },
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
  });
});
