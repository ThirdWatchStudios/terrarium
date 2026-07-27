import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
} from '../scripts/highOblique/a1bSingleOpenNorthwestCrossJunctionProposal';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleOpenNortheastCrossJunctionGate,
  type EqualHeightSingleOpenNortheastCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleOpenNortheastCrossJunctionGate';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
} from '../scripts/highOblique/equalHeightSingleOpenNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
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
  'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const FORBIDDEN_NEW_SOURCE_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/single-open-northeast-cross-junction',
);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

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
): EqualHeightSingleOpenNortheastCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
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
    })) as EqualHeightSingleOpenNortheastCrossJunctionMatrix;
}

const patternFor = (armLength: number): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (row === armLength - 1 && column === armLength - 1) ||
      (row === armLength + 1 &&
        (column === armLength - 1 || column === armLength + 1))
        ? '#'
        : '.',
    ).join(''),
  );
};

function rasterCandidate(
  cellPixels: number,
  background: '#A8A28F' | '#252A28',
  transform: 'none' | 'mirror-x',
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne_se_sw-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne_se_sw-upper.svg'));
  const transformedBody = transform === 'mirror-x'
    ? `<g transform="translate(128 0) scale(-1 1)">${body}</g>`
    : body;
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/>${transformedBody}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function mirrorDistance(
  direct: ReturnType<Resvg['render']>,
  candidate: ReturnType<Resvg['render']>,
): {
  readonly differingChannelRatio: number;
  readonly meanAbsoluteChannelDistance: number;
  readonly maximumChannelDistance: number;
} {
  const directPixels = direct.pixels;
  const candidatePixels = candidate.pixels;
  let differingChannels = 0;
  let totalDistance = 0;
  let maximumDistance = 0;
  for (let row = 0; row < direct.height; row += 1) {
    for (let column = 0; column < direct.width; column += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        const directOffset =
          (row * direct.width + (direct.width - column - 1)) * 4 + channel;
        const candidateOffset =
          (row * candidate.width + column) * 4 + channel;
        const distance = Math.abs(
          directPixels[directOffset] - candidatePixels[candidateOffset],
        );
        if (distance > 0) differingChannels += 1;
        totalDistance += distance;
        maximumDistance = Math.max(maximumDistance, distance);
      }
    }
  }
  return {
    differingChannelRatio: differingChannels / directPixels.length,
    meanAbsoluteChannelDistance: totalDistance / directPixels.length,
    maximumChannelDistance: maximumDistance,
  };
}

function rgbAt(
  raster: ReturnType<Resvg['render']>,
  normalizedColumn: number,
  normalizedRow: number,
): readonly [number, number, number] {
  const column = Math.floor(normalizedColumn * raster.width);
  const row = Math.floor(normalizedRow * raster.height);
  const offset = (row * raster.width + column) * 4;
  const pixels = raster.pixels;
  return [
    pixels[offset],
    pixels[offset + 1],
    pixels[offset + 2],
  ];
}

function hasOpaqueRgb(
  raster: ReturnType<Resvg['render']>,
  expected: readonly [number, number, number],
  tolerance = 0,
): boolean {
  const pixels = raster.pixels;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (
      Math.abs(pixels[offset] - expected[0]) <= tolerance &&
      Math.abs(pixels[offset + 1] - expected[1]) <= tolerance &&
      Math.abs(pixels[offset + 2] - expected[2]) <= tolerance &&
      pixels[offset + 3] === 255
    ) {
      return true;
    }
  }
  return false;
}

const productionSignature = (): string => {
  const atlas = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
  return JSON.stringify({
    schema: CURRENT_SCHEMA_VERSION,
    blobConfigs: BLOB_CONFIGS,
    authoredStems: A1B_AUTHORED_STEMS,
    wallTemplateIds: WALL_TEMPLATES.map(({ id }) => id),
    atlasFrameIds: Object.keys(atlas.frames),
    mask45Frame: atlas.frames.mask_45,
  });
};

describe('QuotaCo accepted single-open northeast cross-junction gate', () => {
  it('locks mask_45 as the accepted plain whole-cell X-mirror derivation of mask_33', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE;
    expect(gate).toMatchObject({
      stem: 'equal-height-single-open-northeast-cross-junction-gate',
      status: 'owner-accepted-single-open-northeast-cross-junction-gate',
      contract: false,
      candidate: {
        maskIndex: 45,
        sourceMaskIndex: 33,
        sourceStem: 'open_cross_filled_ne_se_sw',
        baseFile: 'open_cross_filled_ne_se_sw-base.svg',
        upperFile: 'open_cross_filled_ne_se_sw-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['ne'],
        solidDiagonals: ['se', 'sw', 'nw'],
        fixedLightRole: 'single-open-northeast-four-way-hub',
        transform: 'mirror-x',
        derivation: 'none',
        resolution: 'approved-derivation',
      },
      sourceMaskRows: [33],
      controlMaskRows: [43, 32, 40],
      maskRowsUnderReview: [],
      maskRowsAccepted: [45],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      reviewGrounds: ['light', 'dark'],
      sourceGateAccepted: true,
      candidateAccepted: true,
      ledgerPromotion: true,
      xMirrorAllowed: true,
      filteredXMirrorApplied: false,
      yMirrorAllowed: false,
      rotationAllowed: false,
      proofSourceMutation: false,
      productionArtMutation: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      atlasMutation: false,
      blobMappingMutation: false,
      schemaChange: false,
      unityRegistration: false,
      exportable: false,
      committedAtlas: false,
      temporaryFrameIds: true,
    });
    expect(BLOB_CONFIGS[45]).toBe(0xef);
    expect(configForIndex(45)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'solid',
      nw: 'solid',
    });
    expect(
      () => validateEqualHeightSingleOpenNortheastCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-cell evidence from literal northeast-open occupancy', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE;
    expect(patternFor(1)).toEqual(['##.', '###', '###']);
    expect(gate.compactMatrix).toEqual(matrixFor(patternFor(1)));
    expect(gate.threeCellArmMatrix).toEqual(matrixFor(patternFor(3)));
    expect(gate.sixCellArmMatrix).toEqual(matrixFor(patternFor(6)));
    expect(gate.compactMatrix).toEqual([
      [20, 26, null],
      [24, 45, 26],
      [16, 38, 34],
    ]);
    expect(gate.threeCellArmMatrix).toEqual([
      [null, null, null, 4, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, 20, 27, null, null, null],
      [2, 10, 25, 45, 28, 10, 8],
      [null, null, 16, 39, 34, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(gate.sixCellArmMatrix).toEqual([
      [null, null, null, null, null, null, 4, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, 20, 27, null, null, null, null, null, null],
      [2, 10, 10, 10, 10, 25, 45, 28, 10, 10, 10, 10, 8],
      [null, null, null, null, null, 16, 39, 34, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 5, null, null, null, null, null, null],
      [null, null, null, null, null, null, 1, null, null, null, null, null, null],
    ]);
  });

  it('keeps the source, controls, and installed neighbors accepted with row 45 promoted', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE;
    const installed = new Set([
      ...gate.compactMatrix.flat(),
      ...gate.threeCellArmMatrix.flat(),
      ...gate.sixCellArmMatrix.flat(),
    ].filter((index): index is number => index !== null));
    installed.delete(45);
    expect([...installed].sort((left, right) => left - right)).toEqual(
      gate.installedNeighborMaskRows,
    );
    for (const index of [
      ...gate.controlMaskRows,
      ...installed,
    ]) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[33]).toMatchObject({
      id: 'mask_33',
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: gate.candidate.sourceStem,
          baseFile: gate.candidate.baseFile,
          upperFile: gate.candidate.upperFile,
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[45]).toMatchObject({
      id: 'mask_45',
      canonicalMask: 0xef,
      pockets: ['ne'],
      solidDiagonals: ['se', 'sw', 'nw'],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-open-northeast-cross-junction',
          sourceStem: gate.candidate.sourceStem,
          baseFile: gate.candidate.baseFile,
          upperFile: gate.candidate.upperFile,
          transform: 'mirror-x',
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
  });

  it('reuses the accepted Mask 33 inventory read-only with no filter or companion SVG', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE;
    const inventoryBefore = readdirSync(SOURCE_DIRECTORY).sort();
    const baseBefore = source('open_cross_filled_ne_se_sw-base.svg');
    const upperBefore = source('open_cross_filled_ne_se_sw-upper.svg');

    expect(inventoryBefore).toEqual([
      'README.md',
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ]);
    expect(
      A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY
        .map(({ filename }) => filename),
    ).toEqual([
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ]);
    expect(gate.renderingDecision).toMatchObject({
      kind: 'accepted-plain-whole-cell-x-mirror',
      scope: 'external-proof-source-reuse',
      sourceGate:
        EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem,
      sourceGateStatus:
        EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.status,
      sourceDirectory: SOURCE_PREFIX,
      reusedSourceFiles:
        EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE
          .renderingDecision.authoredSourceFiles,
      newAuthoredSourceFiles: [],
      sourceOmissions: [],
      sourceCanvas: 128,
      mirrorAxisX: 64,
      mirrorPolicy: 'whole-cell-x-no-filter',
      seamFilter: 'none',
      sourceRelationship:
        'read-only-x-mirror-of-owner-accepted-mask-33-proof-source',
      geometryControlMaskIndices: [43, 32],
      northeastReturnControlMaskIndex: 40,
    });
    expect(baseBefore + upperBefore).not.toMatch(
      /\b(?:transform|href|xlink:href)\s*=/,
    );
    expect(existsSync(FORBIDDEN_NEW_SOURCE_DIRECTORY)).toBe(false);
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual(inventoryBefore);
    expect(source('open_cross_filled_ne_se_sw-base.svg')).toBe(baseBefore);
    expect(source('open_cross_filled_ne_se_sw-upper.svg')).toBe(upperBefore);
  });

  it('renders the exact whole-cell mirror at 240/90/40 on both review grounds', () => {
    for (const cellPixels of [240, 90, 40] as const) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        const direct = rasterCandidate(cellPixels, background, 'none');
        const candidate = rasterCandidate(
          cellPixels,
          background,
          'mirror-x',
        );
        expect([candidate.width, candidate.height]).toEqual([
          cellPixels,
          cellPixels,
        ]);
        const distance = mirrorDistance(direct, candidate);
        expect(distance.differingChannelRatio).toBeLessThanOrEqual(0.016);
        expect(distance.meanAbsoluteChannelDistance)
          .toBeLessThanOrEqual(0.27);
        expect(distance.maximumChannelDistance).toBeLessThanOrEqual(45);
        expect(hasOpaqueRgb(candidate, [217, 208, 185])).toBe(true);
        expect(hasOpaqueRgb(candidate, [182, 95, 77], 4)).toBe(false);
        expect(hasOpaqueRgb(candidate, [41, 75, 60], 4)).toBe(false);
        if (background === '#A8A28F') {
          expect(rgbAt(candidate, 0.98, 0.02)).toEqual([168, 162, 143]);
          expect(rgbAt(candidate, 0.02, 0.02)).not.toEqual([168, 162, 143]);
        }
      }
    }
  });

  it('rejects topology, source, matrix, filter, demotion, and production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          sourceMaskIndex: 40,
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'none',
        },
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        compactMatrix: [[45]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        filteredXMirrorApplied: true,
      } as unknown as typeof gate),
    ).toThrow(/proof-only production boundary/);
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        candidateAccepted: false,
        ledgerPromotion: false,
        maskRowsUnderReview: [45] as const,
        maskRowsAccepted: [] as const,
      } as unknown as typeof gate),
    ).toThrow(/identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenNortheastCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/proof-only production boundary/);
  });

  it('leaves the production/export/schema/blob signature unchanged', () => {
    const before = productionSignature();
    validateEqualHeightSingleOpenNortheastCrossJunctionGate();
    expect(productionSignature()).toBe(before);
    expect(CURRENT_SCHEMA_VERSION).toBe(19);
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(A1B_AUTHORED_STEMS).not.toContain(
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE
        .candidate.sourceStem,
    );
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE
        .candidate.sourceStem,
    );
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
