import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
  validateEqualHeightEastPartialTJunctionGate,
} from '../scripts/highOblique/equalHeightEastPartialTJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  BLOB_CONFIGS,
  NB,
  blobContract,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/west-partial-t-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);
const BLOCK_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-block',
);
const HORIZONTAL_REPEAT_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-horizontal-repeat',
);
const VERTICAL_TERMINUS_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/vertical-terminus',
);

type Matrix = readonly (readonly (number | null)[])[];
type Edge = 'north' | 'east' | 'south' | 'west';

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

const sourceAt = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const sourceIds = (svg: string): readonly string[] =>
  [...svg.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

function rasterPair(
  baseSource: string,
  upperSource: string,
  mirrorX = false,
): Raster {
  const content = `${stripSvgShell(baseSource)}${stripSvgShell(upperSource)}`;
  const body = mirrorX
    ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
    : content;
  const rendered = new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function candidateRaster(maskIndex: 36 | 27): Raster {
  const stem = maskIndex === 36 ? 'open_w_t_filled_ne' : 'open_w_t_filled_se';
  const baseSource = sourceAt(SOURCE_DIRECTORY, `${stem}-base.svg`);
  const upperSource = sourceAt(SOURCE_DIRECTORY, `${stem}-upper.svg`);
  const derived = maskIndex === 36
    ? derivePromotedSoutheastSourcePair(baseSource, upperSource)
    : { baseSource, upperSource };
  return rasterPair(derived.baseSource, derived.upperSource, true);
}

function acceptedRaster(
  directory: string,
  stem: string,
  options: { readonly mirrorX?: boolean; readonly filter?: boolean } = {},
): Raster {
  const baseSource = sourceAt(directory, `${stem}-base.svg`);
  const upperSource = sourceAt(directory, `${stem}-upper.svg`);
  const derived = options.filter
    ? derivePromotedSoutheastSourcePair(baseSource, upperSource)
    : { baseSource, upperSource };
  return rasterPair(derived.baseSource, derived.upperSource, options.mirrorX ?? false);
}

function rgbaAt(raster: Raster, x: number, y: number): readonly number[] {
  const offset = (y * raster.width + x) * 4;
  return [...raster.pixels.slice(offset, offset + 4)];
}

function edgeProfile(raster: Raster, edge: Edge): readonly (readonly number[])[] {
  return Array.from({ length: 128 }, (_, position) => {
    if (edge === 'north') return rgbaAt(raster, position, 0);
    if (edge === 'east') return rgbaAt(raster, 127, position);
    if (edge === 'south') return rgbaAt(raster, position, 127);
    return rgbaAt(raster, 0, position);
  });
}

const opaqueProfile = (raster: Raster, edge: Edge): readonly boolean[] =>
  edgeProfile(raster, edge).map((rgba) => rgba[3] === 255);

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

/** Derive every tile index from occupied cells instead of trusting labels. */
function matrixFor(pattern: readonly string[]): Matrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
  const occupied = (col: number, row: number): boolean =>
    row >= 0 && row < rows && col >= 0 && col < columns && pattern[row][col] === '#';
  return pattern.map((row, rowIndex) => [...row].map((cell, colIndex) => {
    if (cell !== '#') return null;
    let raw = 0;
    for (const [bit, dx, dy] of NEIGHBORS) {
      if (occupied(colIndex + dx, rowIndex + dy)) raw |= bit;
    }
    return blobIndex(raw);
  }));
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    blobConfigs: BLOB_CONFIGS,
    wallStems: A1B_AUTHORED_STEMS,
    walls: WALL_TEMPLATES.map(({ id }) => id),
    floors: FLOOR_TEMPLATES.map(({ id }) => id),
    props: PROP_TEMPLATES.map(({ id }) => id),
    defaults: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();

describe('QuotaCo owner-accepted east partial T-junction gate', () => {
  it('locks the mirrored state diamond, raw masks, and fixed-light source roles', () => {
    expect(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-east-partial-t-junction-gate',
      version: 0,
      status: 'owner-accepted-east-partial-t-junction-gate',
      contract: false,
      topologyClass: 'single-filled-pocket-t-junction-pair',
      stateDiamond: {
        openMaskIndex: 13,
        partialMaskIndices: [36, 27],
        filledMaskIndex: 42,
      },
      maskRowsUnderReview: [],
      maskRowsAccepted: [36, 27],
      reviewCellSizes: [240, 90, 40],
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
    expect(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.candidates).toEqual([
      {
        maskIndex: 36,
        sourceMaskIndex: 17,
        sourceStem: 'open_w_t_filled_ne',
        baseFile: 'open_w_t_filled_ne-base.svg',
        upperFile: 'open_w_t_filled_ne-upper.svg',
        solidDiagonal: 'nw',
        openPocket: 'sw',
        fixedLightRole: 'foreground',
        westSocketControl: 38,
        transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
        resolution: 'approved-derivation',
      },
      {
        maskIndex: 27,
        sourceMaskIndex: 21,
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
        solidDiagonal: 'sw',
        openPocket: 'nw',
        fixedLightRole: 'rear',
        westSocketControl: 31,
        transform: 'mirror-x',
        derivation: 'none',
        resolution: 'approved-derivation',
      },
    ]);
    expect(BLOB_CONFIGS[36]).toBe(141);
    expect(BLOB_CONFIGS[27]).toBe(77);
    expect(configForIndex(36)).toEqual({
      n: true, e: false, s: true, w: true,
      ne: 'exposed', se: 'exposed', sw: 'concave', nw: 'solid',
    });
    expect(configForIndex(27)).toEqual({
      n: true, e: false, s: true, w: true,
      ne: 'exposed', se: 'exposed', sw: 'solid', nw: 'concave',
    });
    expect(() => validateEqualHeightEastPartialTJunctionGate()).not.toThrow();
  });

  it('derives the compact and long east occupancies from the literal wall mass', () => {
    expect(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.compactMatrices)
      .toEqual({
        filledNorthWest: matrixFor(['##', '##', '.#']),
        filledSouthWest: matrixFor(['.#', '##', '##']),
      });
    expect(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.longMatrices)
      .toEqual({
        filledNorthWest: matrixFor([
          '######',
          '######',
          '.....#',
          '.....#',
          '.....#',
        ]),
        filledSouthWest: matrixFor([
          '.....#',
          '.....#',
          '.....#',
          '######',
          '######',
        ]),
      });

    for (const matrix of [
      ...Object.values(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.compactMatrices),
      ...Object.values(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.longMatrices),
    ]) {
      for (const index of matrix.flat()) {
        if (index === null || index === 36 || index === 27) continue;
        expect(
          EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
          `matrix neighbor mask_${index}`,
        ).toBe('accepted-source-mapping');
      }
    }
  });

  it('reuses only the accepted west sources and applies the filter only to mask_36', () => {
    expect(readdirSync(SOURCE_DIRECTORY)
      .filter((filename) => filename.endsWith('.svg')).sort()).toEqual([
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ]);

    const foregroundBase = sourceAt(SOURCE_DIRECTORY, 'open_w_t_filled_ne-base.svg');
    const foregroundUpper = sourceAt(SOURCE_DIRECTORY, 'open_w_t_filled_ne-upper.svg');
    const foregroundDerived = derivePromotedSoutheastSourcePair(
      foregroundBase,
      foregroundUpper,
    );
    expect(foregroundBase).toContain('id="base-boundary-seam"');
    expect(foregroundUpper).toContain('id="upper-boundary-seam"');
    expect(foregroundDerived.baseSource).not.toContain('base-boundary-seam');
    expect(foregroundDerived.upperSource).not.toContain('upper-boundary-seam');
    expect(foregroundDerived.baseSource).toContain('id="base-south-service-seam"');
    expect(foregroundDerived.upperSource).toContain('id="upper-south-service-seam"');
    expect(sourceIds(foregroundDerived.baseSource)).toEqual(
      sourceIds(foregroundBase).filter((id) => id !== 'base-boundary-seam'),
    );
    expect(sourceIds(foregroundDerived.upperSource)).toEqual(
      sourceIds(foregroundUpper).filter((id) => id !== 'upper-boundary-seam'),
    );

    const rearBase = sourceAt(SOURCE_DIRECTORY, 'open_w_t_filled_se-base.svg');
    const rearUpper = sourceAt(SOURCE_DIRECTORY, 'open_w_t_filled_se-upper.svg');
    expect(rearBase).not.toContain('base-boundary-seam');
    expect(rearUpper).not.toContain('upper-boundary-seam');
    expect(EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.candidates[1].derivation)
      .toBe('none');
  });

  it('closes every compact and long N/W/S socket against accepted neighbors', () => {
    const mask36 = candidateRaster(36);
    const mask27 = candidateRaster(27);
    const mask26 = acceptedRaster(BLOCK_DIRECTORY, 'filled_nw_elbow', { mirrorX: true });
    const mask16 = acceptedRaster(BLOCK_DIRECTORY, 'filled_sw_elbow');
    const mask38 = acceptedRaster(HORIZONTAL_REPEAT_DIRECTORY, 'filled_s_middle');
    const mask1 = acceptedRaster(VERTICAL_TERMINUS_DIRECTORY, 'vertical_s_terminus', {
      mirrorX: true,
    });
    const mask5 = acceptedRaster(CANONICAL_DIRECTORY, 'full_w_straight', {
      mirrorX: true,
    });
    const mask4 = acceptedRaster(VERTICAL_TERMINUS_DIRECTORY, 'vertical_n_terminus', {
      mirrorX: true,
    });
    const mask20 = acceptedRaster(BLOCK_DIRECTORY, 'filled_nw_elbow');
    const mask31 = acceptedRaster(HORIZONTAL_REPEAT_DIRECTORY, 'filled_n_middle');
    const mask34 = acceptedRaster(BLOCK_DIRECTORY, 'filled_sw_elbow', {
      mirrorX: true,
      filter: true,
    });

    expect(edgeProfile(mask36, 'north')).toEqual(edgeProfile(mask26, 'south'));
    expect(edgeProfile(mask36, 'west')).toEqual(edgeProfile(mask16, 'east'));
    expect(edgeProfile(mask36, 'west')).toEqual(edgeProfile(mask38, 'east'));
    // The east vertical sources own four low-alpha contact-shade pixels. Their
    // solid silhouettes must align, while exact RGBA ownership stays source-local.
    expect(opaqueProfile(mask36, 'south')).toEqual(opaqueProfile(mask1, 'north'));
    expect(opaqueProfile(mask36, 'south')).toEqual(opaqueProfile(mask5, 'north'));

    expect(edgeProfile(mask27, 'north')).toEqual(edgeProfile(mask4, 'south'));
    expect(edgeProfile(mask27, 'north')).toEqual(edgeProfile(mask5, 'south'));
    expect(edgeProfile(mask27, 'west')).toEqual(edgeProfile(mask20, 'east'));
    expect(edgeProfile(mask27, 'west')).toEqual(edgeProfile(mask31, 'east'));
    expect(edgeProfile(mask27, 'south')).toEqual(edgeProfile(mask34, 'north'));
  });

  it('promotes both east rows as approved derivations and keeps production unchanged', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[36]).toMatchObject({
      topologyClass: 't-junction',
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_ne',
          transform: 'mirror-x',
          derivation: 'accepted-southeast-seam-filter',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[27]).toMatchObject({
      topologyClass: 't-junction',
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_se',
          transform: 'mirror-x',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 21,
      'approved-derivation': 16,
      'synthetic-assembly': 10,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'accepted-source-mapping'))
      .toHaveLength(37);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'proof-only-candidate'))
      .toHaveLength(10);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ topologyClass, resolution }) => (
        topologyClass === 't-junction' && resolution.kind === 'synthetic-assembly'
      ))
      .map(({ index }) => index))
      .toEqual([]);
    expect(productionSignature()).toBe(productionBefore);
  });

  it('rejects demotion and every production claim', () => {
    expect(() => validateEqualHeightEastPartialTJunctionGate({
      ...EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
      maskRowsUnderReview: [36, 27],
      maskRowsAccepted: [],
    } as unknown as typeof EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightEastPartialTJunctionGate({
      ...EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(() => validateEqualHeightEastPartialTJunctionGate({
      ...EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
      xMirrorAllowed: false,
    } as unknown as typeof EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
  });
});
