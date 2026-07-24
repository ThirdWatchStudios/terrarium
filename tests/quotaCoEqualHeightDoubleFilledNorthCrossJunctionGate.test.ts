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
  A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bDoubleFilledNorthCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bDoubleFilledNorthCrossJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledNorthCrossJunctionGate,
  type EqualHeightDoubleFilledNorthCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledNorthCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
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
  'assets/walls/quota-co-building-system-proofs/double-filled-north-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(
  cellPixels: number,
  background: '#A8A28F' | '#252A28',
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_n-base.svg')) +
    stripSvgShell(source('open_cross_filled_n-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/>` +
      `${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function hasOpaqueRgb(
  raster: ReturnType<Resvg['render']>,
  expected: readonly [number, number, number],
  tolerance = 0,
): boolean {
  for (let offset = 0; offset < raster.pixels.length; offset += 4) {
    if (
      Math.abs(raster.pixels[offset] - expected[0]) <= tolerance &&
      Math.abs(raster.pixels[offset + 1] - expected[1]) <= tolerance &&
      Math.abs(raster.pixels[offset + 2] - expected[2]) <= tolerance &&
      raster.pixels[offset + 3] === 255
    ) {
      return true;
    }
  }
  return false;
}

function opaqueRgbAt(
  raster: ReturnType<Resvg['render']>,
  x: number,
  y: number,
): readonly [number, number, number] {
  const offset = (y * raster.width + x) * 4;
  expect(raster.pixels[offset + 3]).toBe(255);
  return [
    raster.pixels[offset],
    raster.pixels[offset + 1],
    raster.pixels[offset + 2],
  ];
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
function matrixFor(
  pattern: readonly string[],
): EqualHeightDoubleFilledNorthCrossJunctionMatrix {
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
    })) as EqualHeightDoubleFilledNorthCrossJunctionMatrix;
}

const doubleFilledNorthCrossPattern = (
  extent: number,
): readonly string[] => {
  const size = extent * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      row === extent - 1 ||
      row === extent ||
      (column === extent && row > extent)
        ? '#'
        : '.',
    ).join(''),
  );
};

describe('QuotaCo accepted double-filled north cross-junction gate', () => {
  it('strictly compiles the exact flattened two-file mask_39 proof inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_n-base.svg',
      'open_cross_filled_n-upper.svg',
    ]);
    expect(
      A1B_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
    ).toEqual([
      expect.objectContaining({
        id: 'open_cross_filled_n-base',
        filename: 'open_cross_filled_n-base.svg',
        sourceMaskIndex: 39,
        boundaryRole: 'double-filled-north-cross-hub',
        layer: 'base',
        semanticGroup: 'detail/base',
      }),
      expect.objectContaining({
        id: 'open_cross_filled_n-upper',
        filename: 'open_cross_filled_n-upper.svg',
        sourceMaskIndex: 39,
        boundaryRole: 'double-filled-north-cross-hub',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      }),
    ]);

    const compiled =
      await compileA1bDoubleFilledNorthCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_n-base.svg',
      'open_cross_filled_n-upper.svg',
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

  it('locks one continuous north slab, one cream owner, and one rounded south handoff', () => {
    const base = source('open_cross_filled_n-base.svg');
    expect(base).toContain(
      'id="base-buried-north-underlay" d="M0 0H128V95H0Z"',
    );
    expect(base).toContain(
      'id="base-contour-exposed-south" d="M103 95H128V120H120V128H103V120H0V95Z"',
    );
    expect(base).not.toMatch(
      /id="(?:base-contour-open-north|base-green-open-north|base-face-shade-open-north)"/,
    );

    const upper = source('open_cross_filled_n-upper.svg');
    expect(upper).toContain(
      'id="upper-contour" d="M0 0H128V97H115A10 10 0 0 0 105 107V128H56V107A10 10 0 0 0 46 97H0Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M0 0H128V95H113A10 10 0 0 0 103 105V128H58V105A10 10 0 0 0 48 95H0Z"',
    );
    expect(upper).toContain(
      'id="upper-horizontal-face-shade" d="M0 63H58V88H0Z M105 63H128V88H105Z"',
    );
    expect(upper).toContain(
      'id="upper-coral-band" d="M0 88H58V94H0Z M97 128V94H128V88H108A6 6 0 0 0 102 94V128Z"',
    );
    expect(upper).toContain(
      'id="upper-green-handoff" d="M0 94H58V97H0Z M102 91H105A3 3 0 0 0 108 94H128V97H108A3 3 0 0 0 105 100V128H102Z"',
    );
    expect(upper).toContain(
      'id="upper-south-plane-light" d="M58 88H90.5V128H58Z"',
    );
    expect(upper).toContain(
      'id="upper-south-arris-lip" d="M90.5 88H92V128H90.5Z"',
    );
    expect(upper).toContain(
      'id="upper-south-face-shade" d="M92 88H105V128H92Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-seam" d="M92 88V127"',
    );
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    expect(upper).not.toMatch(
      /id="[^"]*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|center-seam)"/i,
    );
  });

  it('retains the cream, coral, and green read at 240, 90, and 40 pixels on both grounds', () => {
    for (const cellPixels of [240, 90, 40] as const) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        const raster = rasterCandidate(cellPixels, background);
        expect([raster.width, raster.height]).toEqual([
          cellPixels,
          cellPixels,
        ]);
        expect(
          hasOpaqueRgb(raster, [217, 208, 185]),
          `cream at ${cellPixels}px on ${background}`,
        ).toBe(true);
        expect(
          hasOpaqueRgb(raster, [182, 95, 77], cellPixels === 40 ? 3 : 0),
          `coral at ${cellPixels}px on ${background}`,
        ).toBe(true);
        expect(
          hasOpaqueRgb(raster, [41, 75, 60]),
          `green at ${cellPixels}px on ${background}`,
        ).toBe(true);
      }
    }
  });

  it('keeps the cream top continuous through the south socket and shade off the join', () => {
    const raster = rasterCandidate(128, '#A8A28F');
    const cream = [217, 208, 185] as const;

    expect(opaqueRgbAt(raster, 80, 55)).toEqual(cream);
    expect(opaqueRgbAt(raster, 80, 70)).toEqual(cream);
    expect(opaqueRgbAt(raster, 80, 80)).toEqual(cream);
    expect(opaqueRgbAt(raster, 80, 87)).toEqual(cream);
    expect(opaqueRgbAt(raster, 30, 75)).not.toEqual(cream);

    for (const y of [90, 96, 110] as const) {
      const [red, green, blue] = opaqueRgbAt(raster, 80, y);
      expect(red).toBeGreaterThan(200);
      expect(green).toBeGreaterThan(190);
      expect(blue).toBeGreaterThan(170);
    }
  });

  it('rejects transforms, source-ownership drift, path drift, and unexpected files', async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), 'quota-co-double-filled-north-cross-'),
    );
    const base = source('open_cross_filled_n-base.svg');
    const upper = source('open_cross_filled_n-upper.svg');
    const writeInventory = (
      baseSource: string,
      upperSource: string,
    ): void => {
      writeFileSync(
        path.join(temporaryDirectory, 'README.md'),
        'temporary test bank\n',
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_n-base.svg'),
        baseSource,
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_n-upper.svg'),
        upperSource,
      );
    };
    const compileTemporary = () =>
      compileA1bDoubleFilledNorthCrossJunctionProposalDirectory({
        inputDir: temporaryDirectory,
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs/double-filled-north-cross-junction-test',
      });

    try {
      writeInventory(
        base,
        upper.replace(
          '<g id="detail/upper">',
          '<g id="detail/upper" transform="translate(0 0)">',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(/without transforms/);

      writeInventory(
        base,
        upper.replace(
          '</g>',
          '<path id="upper-cream-bridge" d="M0 0H128V20H0Z" fill="#D9D0B9"/></g>',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /unexpected semantic ids upper-cream-bridge/,
      );

      writeInventory(
        base,
        upper.replace('M0 0H128V95H113', 'M1 0H128V95H113'),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /exact double-filled north geometry for upper-shell/,
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

  it('locks mask_39 topology as an owner-accepted direct source', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem: 'equal-height-double-filled-north-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-double-filled-north-cross-junction-gate',
      contract: false,
      topologyClass: 'double-filled-north-cross-junction',
      candidate: {
        maskIndex: 39,
        sourceMaskIndex: 39,
        sourceStem: 'open_cross_filled_n',
        baseFile: 'open_cross_filled_n-base.svg',
        upperFile: 'open_cross_filled_n-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['se', 'sw'],
        solidDiagonals: ['ne', 'nw'],
        fixedLightRole: 'north-filled-four-way-slab-west-register',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [19, 37],
      installedNeighborMaskRows: [1, 5, 16, 20, 26, 31, 34, 38],
      maskRowsUnderReview: [],
      maskRowsAccepted: [39],
      reviewCellSizes: [240, 90, 40],
      reviewExtentLengths: [1, 3, 6],
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
    expect(BLOB_CONFIGS[39]).toBe(0x9f);
    expect(configForIndex(39)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'concave',
      nw: 'solid',
    });
    expect(
      () => validateEqualHeightDoubleFilledNorthCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives the compact and 3/6-cell slab evidence from actual occupancy', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE;
    expect(doubleFilledNorthCrossPattern(1)).toEqual([
      '###',
      '###',
      '.#.',
    ]);
    expect(gate.compactMatrix).toEqual(
      matrixFor(doubleFilledNorthCrossPattern(1)),
    );
    expect(gate.threeCellExtentMatrix).toEqual(
      matrixFor(doubleFilledNorthCrossPattern(3)),
    );
    expect(gate.sixCellExtentMatrix).toEqual(
      matrixFor(doubleFilledNorthCrossPattern(6)),
    );
    expect(gate.compactMatrix).toEqual([
      [20, 31, 26],
      [16, 39, 34],
      [null, 1, null],
    ]);
    expect(gate.threeCellExtentMatrix).toEqual([
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [20, 31, 31, 31, 31, 31, 26],
      [16, 38, 38, 39, 38, 38, 34],
      [null, null, null, 5, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(gate.sixCellExtentMatrix[5]).toEqual([
      20, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 26,
    ]);
    expect(gate.sixCellExtentMatrix[6]).toEqual([
      16, 38, 38, 38, 38, 38, 39, 38, 38, 38, 38, 38, 34,
    ]);
    expect(gate.sixCellExtentMatrix[12]).toEqual([
      null, null, null, null, null, null, 1,
      null, null, null, null, null, null,
    ]);

    const installedMasks = new Set(
      gate.sixCellExtentMatrix
        .flat()
        .filter((index): index is number => index !== null),
    );
    installedMasks.delete(39);
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 5, 16, 20, 26, 31, 34, 38,
    ]);
    for (const index of installedMasks) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
  });

  it('records row 39 as the exact accepted direct source', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[39]).toMatchObject({
      id: 'mask_39',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['se', 'sw'],
      solidDiagonals: ['ne', 'nw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-north-cross-junction',
          sourceStem: 'open_cross_filled_n',
          baseFile: 'open_cross_filled_n-base.svg',
          upperFile: 'open_cross_filled_n-upper.svg',
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
      EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE
        .acceptedLedgerCounts,
    ).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
    expect(A1B_AUTHORED_STEMS).not.toContain('open_cross_filled_n');
  });

  it('renders and refreshes the accepted gate and its ledger source', () => {
    const styleLoop = readFileSync(
      path.resolve(process.cwd(), 'scripts/styleLoop.ts'),
      'utf8',
    );
    expect(
      styleLoop.match(
        /await renderEqualHeightDoubleFilledNorthCrossJunctionGate\(options, root\);/g,
      ),
    ).toHaveLength(2);
    expect(styleLoop).toContain(
      'doubleFilledNorthCrossJunctionRenderedAt: renderedAt',
    );
    expect(styleLoop).toContain(
      'status.doubleFilledNorthCrossJunctionRenderedAt = renderedAt',
    );
    expect(styleLoop).toContain(
      "normalizedProofFile.startsWith('double-filled-north-cross-junction/')",
    );

    const ledgerRenderer = styleLoop.slice(
      styleLoop.indexOf('async function renderEqualHeightMaskLedger'),
      styleLoop.indexOf('async function renderLowSoutheastCornerFocus'),
    );
    expect(ledgerRenderer).toContain(
      'doubleFilledNorthCrossJunctionProposalFileOverrides',
    );
    expect(ledgerRenderer).toContain(
      'doubleFilledEastCrossJunctionProposalFileOverrides',
    );
  });

  it('rejects demotion, matrix, transform, or production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightDoubleFilledNorthCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [39] as const,
        maskRowsAccepted: [] as const,
        directSourceAccepted: false,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledNorthCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'mirror-x',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightDoubleFilledNorthCrossJunctionGate({
        ...gate,
        compactMatrix: [[39]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightDoubleFilledNorthCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/accepted proof boundary/);
  });

  it('does not mutate blob, templates, exporter, or authored production surfaces', () => {
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(BLOB_CONFIGS[39]).toBe(0x9f);
    expect(A1B_AUTHORED_STEMS).not.toContain('open_cross_filled_n');
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(
      'open_cross_filled_n',
    );
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
