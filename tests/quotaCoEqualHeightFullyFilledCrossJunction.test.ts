import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bFullyFilledCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bFullyFilledCrossJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE,
  validateEqualHeightFullyFilledCrossJunctionGate,
  type EqualHeightFullyFilledCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightFullyFilledCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from '../scripts/highOblique/equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from '../scripts/highOblique/equalHeightThickWallRepeatGate';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  NB,
  blobContract,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { WALL_TEMPLATES } from '../src/tiles/templates';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/fully-filled-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

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

function solidBlockMatrix(
  size: 3 | 4 | 6,
): EqualHeightFullyFilledCrossJunctionMatrix {
  const occupied = (column: number, row: number): boolean =>
    column >= 0 && row >= 0 && column < size && row < size;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw);
    }),
  ) as EqualHeightFullyFilledCrossJunctionMatrix;
}

function raster(
  layer: 'base' | 'upper' | 'composed',
  size: number,
  background: '#A8A28F' | '#252A28',
): ReturnType<Resvg['render']> {
  const candidate =
    EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE.candidate;
  const base = stripSvgShell(source(candidate.baseFile));
  const upper = stripSvgShell(source(candidate.upperFile));
  const body = layer === 'base'
    ? base
    : layer === 'upper'
      ? upper
      : `${base}${upper}`;
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
      `<rect width="128" height="128" fill="${background}"/>${body}</svg>`,
    {
      fitTo: { mode: 'width', value: size },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function allPixelsEqual(
  rendered: ReturnType<Resvg['render']>,
  rgb: readonly [number, number, number],
): boolean {
  for (let offset = 0; offset < rendered.pixels.length; offset += 4) {
    if (
      rendered.pixels[offset] !== rgb[0] ||
      rendered.pixels[offset + 1] !== rgb[1] ||
      rendered.pixels[offset + 2] !== rgb[2] ||
      rendered.pixels[offset + 3] !== 255
    ) {
      return false;
    }
  }
  return true;
}

const productionSignature = (): string => {
  const atlas = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
  return JSON.stringify({
    schema: CURRENT_SCHEMA_VERSION,
    blobContract: blobContract(),
    blobConfigs: BLOB_CONFIGS,
    authoredStems: A1B_AUTHORED_STEMS,
    wallTemplateIds: WALL_TEMPLATES.map(({ id }) => id),
    atlasFrameIds: Object.keys(atlas.frames),
    mask46Frame: atlas.frames.mask_46,
  });
};

const productionBefore = productionSignature();

describe('QuotaCo owner-accepted fully filled cross-junction gate', () => {
  it('compiles one strict two-layer proof source outside the canonical bank', async () => {
    expect(
      A1B_FULLY_FILLED_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
    ).toEqual([
      {
        id: 'filled_center-base',
        filename: 'filled_center-base.svg',
        sourceMaskIndex: 46,
        boundaryRole: 'fully-buried-solid-center',
        layer: 'base',
        semanticGroup: 'detail/base',
      },
      {
        id: 'filled_center-upper',
        filename: 'filled_center-upper.svg',
        sourceMaskIndex: 46,
        boundaryRole: 'fully-buried-solid-center',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      },
    ]);
    const compiled =
      await compileA1bFullyFilledCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual([
      `${SOURCE_PREFIX}/filled_center-base.svg`,
      `${SOURCE_PREFIX}/filled_center-upper.svg`,
    ]);
    expect(compiled.map(({ shapes }) => shapes.length)).toEqual([1, 1]);
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_center');
  });

  it('locks canonical mask_46 as one accepted fixed-view direct source', () => {
    const gate =
      EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE;
    expect(gate).toMatchObject({
      stem: 'equal-height-fully-filled-cross-junction-gate',
      status: 'owner-accepted-fully-filled-cross-junction-gate',
      contract: false,
      candidate: {
        maskIndex: 46,
        sourceMaskIndex: 46,
        sourceStem: 'filled_center',
        baseFile: 'filled_center-base.svg',
        upperFile: 'filled_center-upper.svg',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: [],
        solidDiagonals: ['ne', 'se', 'sw', 'nw'],
        fixedLightRole: 'fully-buried-solid-center',
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      geometryControlMaskRows: [33, 41, 44, 45],
      boundaryControlMaskRows: [16, 20, 24, 26, 31, 34, 38, 42],
      maskRowsUnderReview: [],
      maskRowsAccepted: [46],
      reviewCellSizes: [240, 90, 40],
      reviewBlockSizes: [3, 4, 6],
      reviewGrounds: ['light', 'dark'],
      directSourceAccepted: true,
      productionArtMutation: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      atlasMutation: false,
      blobMappingMutation: false,
      schemaChange: false,
      unityRegistration: false,
      exportable: false,
    });
    expect(BLOB_CONFIGS[46]).toBe(0xff);
    expect(configForIndex(46)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'solid',
      sw: 'solid',
      nw: 'solid',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[46]).toMatchObject({
      id: 'mask_46',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: [],
      solidDiagonals: ['ne', 'se', 'sw', 'nw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'fully-filled-cross-junction',
          sourceStem: 'filled_center',
          baseFile: 'filled_center-base.svg',
          upperFile: 'filled_center-upper.svg',
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
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(
      () => validateEqualHeightFullyFilledCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives the exact 3x3, 4x4, and 6x6 solid occupancies', () => {
    const gate =
      EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE;
    expect(gate.threeByThreeMatrix).toEqual(solidBlockMatrix(3));
    expect(gate.fourByFourMatrix).toEqual(solidBlockMatrix(4));
    expect(gate.sixBySixMatrix).toEqual(solidBlockMatrix(6));
    expect(gate.threeByThreeMatrix).toEqual([
      [20, 31, 26],
      [24, 46, 42],
      [16, 38, 34],
    ]);
    expect(
      gate.fourByFourMatrix.flat().filter((mask) => mask === 46),
    ).toHaveLength(4);
    expect(
      gate.sixBySixMatrix.flat().filter((mask) => mask === 46),
    ).toHaveLength(16);
  });

  it('uses only one buried underlay and one seamless cream field', () => {
    const base = source('filled_center-base.svg');
    const upper = source('filled_center-upper.svg');
    expect(base).toContain(
      'id="base-buried-underlay" d="M0 0H128V128H0Z" fill="#252A28"',
    );
    expect(upper).toContain(
      'id="upper-solid-top-fill" d="M0 0H128V128H0Z" fill="#D9D0B9"',
    );
    expect(`${base}\n${upper}`).not.toMatch(
      /\btransform=|stroke=|highlight|coral|green|shade|plinth|arris|seam|contour|cap|return/i,
    );
  });

  it('is pixel-solid at 240, 90, and 40 px on both grounds', () => {
    for (const size of [240, 90, 40]) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        expect(allPixelsEqual(
          raster('base', size, background),
          [37, 42, 40],
        )).toBe(true);
        expect(allPixelsEqual(
          raster('upper', size, background),
          [217, 208, 185],
        )).toBe(true);
        expect(allPixelsEqual(
          raster('composed', size, background),
          [217, 208, 185],
        )).toBe(true);
      }
    }
  });

  it('depends only on accepted solid-mass perimeter families', () => {
    expect(EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.maskRowsAccepted)
      .toEqual([16, 20, 26, 34]);
    expect(EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.maskRowsAccepted)
      .toEqual([24, 42]);
    expect(
      EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.maskRowsAccepted,
    ).toEqual([31, 38]);
    for (
      const index
      of EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE
        .boundaryControlMaskRows
    ) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status)
        .toBe('accepted-source-mapping');
    }
  });

  it('rejects downstream overclaim and preserves production signatures', async () => {
    await compileA1bFullyFilledCrossJunctionProposalDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    const overclaimed = structuredClone(
      EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE,
    ) as any;
    overclaimed.productionRegistration = true;
    expect(
      () => validateEqualHeightFullyFilledCrossJunctionGate(overclaimed),
    ).toThrow(/accepted proof-layer production boundary/);
    expect(productionSignature()).toBe(productionBefore);
  });
});
