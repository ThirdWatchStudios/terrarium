import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bDoubleFilledEastCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bDoubleFilledEastCrossJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
  validateEqualHeightDoubleFilledEastCrossJunctionGate,
  type EqualHeightDoubleFilledEastCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightDoubleFilledEastCrossJunctionGate';
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
  'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(cellPixels: number): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_e-base.svg')) +
    stripSvgShell(source('open_cross_filled_e-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
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
  if (occupied.length === 0) throw new Error(`No alpha at raster column ${column}`);
  return [occupied[0], occupied[occupied.length - 1]];
}

function alphaRowIsContiguous(
  raster: ReturnType<Resvg['render']>,
  row: number,
  span: readonly [number, number],
): boolean {
  for (let column = span[0]; column <= span[1]; column += 1) {
    if (raster.pixels[(row * raster.width + column) * 4 + 3] === 0) return false;
  }
  return true;
}

function alphaColumnIsContiguous(
  raster: ReturnType<Resvg['render']>,
  column: number,
  span: readonly [number, number],
): boolean {
  for (let row = span[0]; row <= span[1]; row += 1) {
    if (raster.pixels[(row * raster.width + column) * 4 + 3] === 0) return false;
  }
  return true;
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
): EqualHeightDoubleFilledEastCrossJunctionMatrix {
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
  })) as EqualHeightDoubleFilledEastCrossJunctionMatrix;
}

const doubleFilledEastCrossPattern = (extent: number): readonly string[] => {
  const size = extent * 2 + 1;
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, column) => (
      column === extent ||
      column === extent + 1 ||
      (row === extent && column < extent)
        ? '#'
        : '.'
    )).join('')
  ));
};

describe('QuotaCo owner-accepted double-filled east cross-junction gate', () => {
  it('strictly compiles the separate two-file mask_25 accepted proof inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ]);
    expect(A1B_DOUBLE_FILLED_EAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY)
      .toEqual([
        expect.objectContaining({
          id: 'open_cross_filled_e-base',
          filename: 'open_cross_filled_e-base.svg',
          sourceMaskIndex: 25,
          boundaryRole: 'double-filled-east-cross-hub',
          layer: 'base',
          semanticGroup: 'detail/base',
        }),
        expect.objectContaining({
          id: 'open_cross_filled_e-upper',
          filename: 'open_cross_filled_e-upper.svg',
          sourceMaskIndex: 25,
          boundaryRole: 'double-filled-east-cross-hub',
          layer: 'upper',
          semanticGroup: 'detail/upper',
        }),
      ]);
    const compiled =
      await compileA1bDoubleFilledEastCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ]);
    for (const candidate of compiled) {
      expect(candidate.shapes.length).toBeGreaterThan(0);
      expect(candidate.content).not.toMatch(/\b(?:transform|href|xlink:href)\s*=/);
      expect(candidate.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
    }
  });

  it('makes the accepted external source available to both its gate and the 47-mask ledger renderer', () => {
    const styleLoop = readFileSync(
      path.resolve(process.cwd(), 'scripts/styleLoop.ts'),
      'utf8',
    );
    const ledgerRenderer = styleLoop.slice(
      styleLoop.indexOf('async function renderEqualHeightMaskLedger'),
      styleLoop.indexOf('async function renderLowSoutheastCornerFocus'),
    );
    expect(ledgerRenderer).toContain(
      '...await doubleFilledEastCrossJunctionProposalFileOverrides(options, root)',
    );
  });

  it('keeps one cream owner, one buried east slab, and no buried east fascia', () => {
    const base = source('open_cross_filled_e-base.svg');
    expect(base).toContain(
      'id="base-buried-east-underlay" d="M56 0H128V128H56Z"',
    );
    expect(base).not.toMatch(
      /id="(?:base-contour-open-ne|base-green-open-ne|base-face-shade-open-ne)"/,
    );

    const upper = source('open_cross_filled_e-upper.svg');
    expect(upper).toContain(
      'id="upper-contour" d="M56 0H128V128H56V107A10 10 0 0 0 46 97H0V56H46A10 10 0 0 0 56 46Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M58 0H128V128H58V105A10 10 0 0 0 48 95H0V58H48A10 10 0 0 0 58 48Z"',
    );
    expect(upper).toContain(
      'id="upper-face-shade-open-sw" d="M46 95H58V97H46Z"',
    );
    expect(upper).not.toContain(
      'id="upper-face-shade-open-sw" d="M46 95H58V128H46Z"',
    );
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    expect(upper).not.toMatch(
      /id="[^"]*(?:open-ne|filled-east|center-seam|cap|peak|post|overlay)"/,
    );
  });

  it('keeps exact cardinal socket spans at 240, 90, and 40 pixels', () => {
    for (const cellPixels of [240, 90, 40] as const) {
      const raster = rasterCandidate(cellPixels);
      expect([raster.width, raster.height]).toEqual([cellPixels, cellPixels]);

      const north = alphaRowSpan(raster, 0);
      const south = alphaRowSpan(raster, raster.height - 1);
      const west = alphaColumnSpan(raster, 0);
      const east = alphaColumnSpan(raster, raster.width - 1);

      expect(
        Math.abs(north[0] - Math.floor(cellPixels * 56 / 128)),
        `north socket start at ${cellPixels}px`,
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(south[0] - Math.floor(cellPixels * 46 / 128)),
        `south socket start at ${cellPixels}px`,
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(west[0] - Math.floor(cellPixels * 56 / 128)),
        `west socket start at ${cellPixels}px`,
      ).toBeLessThanOrEqual(2);
      expect(north[1]).toBeGreaterThanOrEqual(cellPixels - 2);
      expect(south[1]).toBeGreaterThanOrEqual(cellPixels - 2);
      expect(west[1]).toBeGreaterThanOrEqual(Math.floor(cellPixels * 120 / 128));
      expect(east).toEqual([0, cellPixels - 1]);
      expect(alphaRowIsContiguous(raster, 0, north)).toBe(true);
      expect(alphaRowIsContiguous(raster, raster.height - 1, south)).toBe(true);
      expect(alphaColumnIsContiguous(raster, 0, west)).toBe(true);
      expect(alphaColumnIsContiguous(raster, raster.width - 1, east)).toBe(true);
    }
  });

  it('locks mask_25 topology and its accepted direct proof provenance', () => {
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-double-filled-east-cross-junction-gate',
      version: 0,
      status: 'owner-accepted-double-filled-east-cross-junction-gate',
      contract: false,
      topologyClass: 'double-filled-east-cross-junction',
      candidate: {
        maskIndex: 25,
        sourceMaskIndex: 25,
        sourceStem: 'open_cross_filled_e',
        baseFile: 'open_cross_filled_e-base.svg',
        upperFile: 'open_cross_filled_e-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['sw', 'nw'],
        solidDiagonals: ['ne', 'se'],
        fixedLightRole: 'west-branch-into-double-width-east-slab',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [15, 19, 23, 24, 42],
      maskRowsUnderReview: [],
      maskRowsAccepted: [25],
      reviewCellSizes: [240, 90, 40],
      reviewExtentLengths: [1, 3, 6],
      acceptedWestFilledCompanionMaskIndex: 43,
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
    expect(BLOB_CONFIGS[25]).toBe(0x3f);
    expect(configForIndex(25)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'solid', se: 'solid', sw: 'concave', nw: 'concave',
    });
    expect(
      () => validateEqualHeightDoubleFilledEastCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-extent matrices from the intended occupied mass', () => {
    expect(doubleFilledEastCrossPattern(1)).toEqual(['.##', '###', '.##']);
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual(matrixFor(doubleFilledEastCrossPattern(1)));
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.threeCellExtentMatrix,
    ).toEqual(matrixFor(doubleFilledEastCrossPattern(3)));
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.sixCellExtentMatrix,
    ).toEqual(matrixFor(doubleFilledEastCrossPattern(6)));
    expect(EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual([
        [null, 20, 26],
        [2, 25, 42],
        [null, 16, 34],
      ]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.threeCellExtentMatrix,
    ).toEqual([
      [null, null, null, 20, 26, null, null],
      [null, null, null, 24, 42, null, null],
      [null, null, null, 24, 42, null, null],
      [2, 10, 10, 25, 42, null, null],
      [null, null, null, 24, 42, null, null],
      [null, null, null, 24, 42, null, null],
      [null, null, null, 16, 34, null, null],
    ]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.sixCellExtentMatrix[6],
    ).toEqual([2, 10, 10, 10, 10, 10, 25, 42, null, null, null, null, null]);
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.sixCellExtentMatrix[5],
    ).toEqual([null, null, null, null, null, null, 24, 42, null, null, null, null, null]);

    const installedMasks = new Set(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.sixCellExtentMatrix
        .flat()
        .filter((index): index is number => index !== null),
    );
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      2, 10, 16, 20, 24, 25, 26, 34, 42,
    ]);
    expect(installedMasks).not.toContain(43);
    for (const index of installedMasks) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
  });

  it('keeps the control diamond explicit, mask_25 direct, and mask_43 independently derived', () => {
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stateDiamond,
    ).toEqual({
      open: 15,
      singleFilled: [19, 23],
      doubleFilled: 25,
    });
    expect(
      EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE
        .renderingDecision.acceptedControlSources.map(({ maskIndex }) => maskIndex),
    ).toEqual([15, 19, 23, 24, 42]);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[25]).toMatchObject({
      id: 'mask_25',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['sw', 'nw'],
      solidDiagonals: ['ne', 'se'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'double-filled-east-cross-junction',
          sourceStem: 'open_cross_filled_e',
          baseFile: 'open_cross_filled_e-base.svg',
          upperFile: 'open_cross_filled_e-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[43]).toMatchObject({
      id: 'mask_43',
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_cross_filled_e',
          transform: 'mirror-x',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 26,
      'approved-derivation': 17,
    'synthetic-assembly': 4,
      'unresolved-authored-geometry': 0,
    });
    const acceptedStems = EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap(({ resolution }) =>
      resolution.kind === 'direct-reuse' || resolution.kind === 'approved-derivation'
        ? resolution.variants.map(({ sourceStem }) => sourceStem)
        : []);
    expect(acceptedStems).toContain('open_cross_filled_e');
  });

  it('rejects demotion claims, extent drift, and production-boundary drift', () => {
    expect(() => validateEqualHeightDoubleFilledEastCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
      maskRowsUnderReview: [25] as const,
      maskRowsAccepted: [] as const,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightDoubleFilledEastCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
      candidate: {
        ...EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.candidate,
        resolution: 'synthetic-assembly',
      },
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightDoubleFilledEastCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
      compactMatrix: [[25]] as const,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE))
      .toThrow(/compact matrix must be 3x3/);
    expect(() => validateEqualHeightDoubleFilledEastCrossJunctionGate({
      ...EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
  });

  it('does not mutate blob, templates, exporter, or authored production surfaces', () => {
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(BLOB_CONFIGS[25]).toBe(0x3f);
    expect(A1B_AUTHORED_STEMS).not.toContain('open_cross_filled_e');
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain('open_cross_filled_e');
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
